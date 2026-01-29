import Image from 'next/image';
export default function SideImage({ randomImage }: { randomImage: string }) {
    return <div className="hidden md:flex items-center justify-center h-screen w-full">
        <Image src={`https://picsum.photos/seed/${randomImage}/1000/1000`} alt="image" width={1000} height={1000} className=" w-full h-full object-cover" />
    </div>
}