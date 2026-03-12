"use client";

// import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function DemoPage(){
    const [loading, setLoading] = useState(false)
    // const [loading2, setLoading2] = useState(false);

    const handleBlocking = async ()=>{
        setLoading(true);
        await fetch("/api/demo/blocking", {method: "POST"})
        setLoading(false)
    }

    return (
        <div className="p-8 space-x-4">
            <Button onClick={handleBlocking} disabled={loading}>
                Blocking
            </Button>
        </div>
    )
}