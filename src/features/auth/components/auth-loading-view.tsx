import Image from "next/image";

export const AuthLoadingView = ()=>{
    return (
        <div className="flex items-center justify-center h-screen bg-background">
            <Image
                src="/blue2.png"
                alt="Loading"
                width={56}
                height={56}
                className="rounded-2xl animate-breathing"
                priority
            />
        </div>
    )
}
