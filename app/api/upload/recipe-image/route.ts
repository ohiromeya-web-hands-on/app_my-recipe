import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import {
  isOwnerAuthError,
  ownerAuthErrorResult,
  requireOwner,
} from "@/features/auth/require-owner";

const MAX_RECIPE_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_IMAGE_EXTENSIONS = /\.(jpe?g|png|webp)$/i;

export async function POST(request: Request) {
  try {
    await requireOwner();

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "NOT_CONFIGURED",
            message: "BLOB_READ_WRITE_TOKEN is not configured yet",
          },
        },
        { status: 501 },
      );
    }

    const body = (await request.json()) as HandleUploadBody;
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("recipe-images/") || !ALLOWED_IMAGE_EXTENSIONS.test(pathname)) {
          throw new Error("Unsupported recipe image pathname");
        }

        return {
          allowedContentTypes: ALLOWED_IMAGE_CONTENT_TYPES,
          maximumSizeInBytes: MAX_RECIPE_IMAGE_BYTES,
          addRandomSuffix: true,
        };
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    if (isOwnerAuthError(error)) {
      return NextResponse.json(ownerAuthErrorResult(error), {
        status: error.status,
      });
    }

    console.error("recipe image upload failed", error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "UPLOAD_FAILED",
          message: "画像アップロードの準備に失敗しました。",
        },
      },
      { status: 500 },
    );
  }
}
