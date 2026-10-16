"use client";

import {ConversationSidebar} from "@/features/conversations/components/conversation-sidebar";
import { Id } from "../../../../convex/_generated/dataModel";
import { Navbar } from "./Navbar";
import { AppSidebar } from "./app-sidebar";

import {Allotment} from "allotment";
import "allotment/dist/style.css";

const MIN_CHAT_WIDTH = 320;
const MAX_CHAT_WIDTH = 720;
const DEFAULT_CHAT_WIDTH = 420;
const DEFAULT_MAIN_SIZE = 1000;

// AI Studio "Build" layout: nav sidebar | header + (chat | preview/code)
export const ProjectIdLayout = ({
    children,
    projectId
}: {
    children: React.ReactNode;
    projectId: Id<"projects">;
})=>{
    return (
        <div className="w-full h-screen flex bg-background">
            <AppSidebar activeProjectId={projectId}/>
            <div className="flex-1 min-w-0 flex flex-col">
                <Navbar projectId={projectId}/>
                <div className="flex-1 flex overflow-hidden">
                    <Allotment className="flex-1" defaultSizes={[DEFAULT_CHAT_WIDTH, DEFAULT_MAIN_SIZE]}>
                        <Allotment.Pane
                            minSize={MIN_CHAT_WIDTH}
                            maxSize={MAX_CHAT_WIDTH}
                            preferredSize={DEFAULT_CHAT_WIDTH}
                        >
                            <ConversationSidebar projectId={projectId} />
                        </Allotment.Pane>
                        <Allotment.Pane>
                            {children}
                        </Allotment.Pane>
                    </Allotment>
                </div>
            </div>
        </div>
    )
}
