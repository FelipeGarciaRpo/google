import { v } from "convex/values";
import {mutation, query} from "./_generated/server";
import { verifyAuth } from "./auth";

// Commands the agent queued for this project, waiting for the owner's browser
export const getPending = query({
    args: {
        projectId: v.id("projects"),
    },
    handler: async (ctx, args)=>{
        const identity = await verifyAuth(ctx);

        const project = await ctx.db.get("projects", args.projectId);

        if(!project){
            throw new Error("Project not found");
        }

        if(project.ownerId !== identity.subject){
            throw new Error("Unauthorized to access this project");
        }

        return await ctx.db
            .query("commands")
            .withIndex("by_project_status", (q)=>
                q.eq("projectId", args.projectId).eq("status", "pending"))
            .order("asc")
            .collect();
    }
});

// Marks a command as running; returns false if another tab already took it
export const claim = mutation({
    args: {
        commandId: v.id("commands"),
    },
    handler: async (ctx, args)=>{
        const identity = await verifyAuth(ctx);

        const command = await ctx.db.get("commands", args.commandId);

        if(!command){
            throw new Error("Command not found");
        }

        const project = await ctx.db.get("projects", command.projectId);

        if(!project || project.ownerId !== identity.subject){
            throw new Error("Unauthorized to run this command");
        }

        if(command.status !== "pending"){
            return false;
        }

        await ctx.db.patch("commands", args.commandId, { status: "running" });

        return true;
    }
});
