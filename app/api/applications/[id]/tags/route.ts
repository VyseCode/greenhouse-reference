import { Types } from "mongoose";
import {
  ApiError,
  handleError,
  ok,
  parseId,
  readJson,
  requireStaff,
} from "@/lib/api";
import { connectDB } from "@/lib/db";
import { MAX_TAGS } from "@/lib/constants";
import { tagSchema } from "@/lib/validators";
import { Activity } from "@/models/Activity";
import { Application } from "@/models/Application";

type Ctx = RouteContext<"/api/applications/[id]/tags">;

export async function POST(request: Request, ctx: Ctx) {
  try {
    const user = await requireStaff();
    const { id } = await ctx.params;
    parseId(id, "application id");
    const body = tagSchema.parse(await readJson(request));
    await connectDB();

    const application = await Application.findById(id).select("tags name").lean();
    if (!application) throw new ApiError(404, "Application not found");

    if (body.action === "add" && application.tags.length >= MAX_TAGS) {
      throw new ApiError(400, `At most ${MAX_TAGS} tags are allowed`);
    }
    const update =
      body.action === "add"
        ? { $addToSet: { tags: body.tag } }
        : { $pull: { tags: body.tag } };

    await Application.updateOne({ _id: id }, update);
    await Activity.create({
      application: new Types.ObjectId(id),
      actor: user.name,
      type: "tag",
      message: `${body.action === "add" ? "Added" : "Removed"} tag "${body.tag}" on ${application.name}`,
      meta: { tag: body.tag, action: body.action },
    });

    return ok({ action: body.action, tag: body.tag });
  } catch (error) {
    return handleError(error);
  }
}
