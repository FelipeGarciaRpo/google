import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    projects: defineTable({
        name: v.string(),
        ownerId: v.string(),
        updatedAt: v.number(),
        importStatus: v.optional(
            v.union(
                v.literal("importing"),
                v.literal("completed"),
                v.literal("failed")
            )
        ),
        exportStatus: v.optional(
            v.union(
                v.literal("exporting"),
                v.literal("completed"),
                v.literal("failed"),
                v.literal("cancelled")
            )
        ),
        exportRepoUrl: v.optional(v.string()),
        settings: v.optional(
        v.object({
            installCommand: v.optional(v.string()),
            devCommand: v.optional(v.string()),
        })
        ),
    }).index("by_owner", ["ownerId"]),

    files: defineTable({
        projectId: v.id("projects"),
        parentId: v.optional(v.id("files")),
        name: v.string(),
        type: v.union(v.literal("file"), v.literal("folder")),
        content: v.optional(v.string()),
        storageId: v.optional(v.id("_storage")),
        updatedAt: v.number(),  
    })
        .index("by_project", ["projectId"])
        .index("by_parent", ["parentId"])
        .index("by_project_parent", ["projectId", "parentId"]),
    
    conversations: defineTable({
        projectId: v.id("projects"),
        title: v.string(),
        updatedAt: v.number(),
    }).index("by_project", ["projectId"]),

    messages: defineTable({
        conversationId: v.id("conversations"),
        projectId: v.id("projects"),
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
        // Label of the model that wrote an assistant message (e.g. "Gemini 2.5 Flash")
        model: v.optional(v.string()),
        status: v.optional(
            v.union(
                v.literal("processing"),
                v.literal("completed"),
                v.literal("cancelled")
            )
        ) 
    }).index("by_conversation", ["conversationId"])
      .index("by_project_status", ["projectId", "status"]),

    // Shell commands the agent asks the user's browser to run in the WebContainer
    commands: defineTable({
        projectId: v.id("projects"),
        command: v.string(),
        timeoutSeconds: v.number(),
        status: v.union(
            v.literal("pending"),
            v.literal("running"),
            v.literal("completed"),
            v.literal("timeout"),
            v.literal("expired")
        ),
        output: v.optional(v.string()),
        exitCode: v.optional(v.number()),
    }).index("by_project_status", ["projectId", "status"]),

})