import Image from "next/image";
import {Exercise, MessageSvg} from "@/components/duo/exercise";

const dutchSentence = "Ze is een vrouw zonder kinderen.";
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-white">
      <div className="flex flex-col w-full md:w-[37.5rem]">
        <div className="w-full flex text-3xl font-bold text-zinc-700">
          <h1> Write this in English</h1>
        </div>
        {/* Sentence */}
        <div className='w-full h-44 flex'>
          {/* image */}
          <div className="w-32 h-full bg-orange-300">
          
          </div>
          {/* sentence cloud */}
          <div className="flex items-center justify-center w-full">
            <div className="flex items-center relative w-3/4">
              <div className="absolute -left-4 z-10">
                <MessageSvg/>
              </div>
              <div className="rounded-xl min-h-2 border-2 border-zinc-200 pt-2 pb-3 px-4">
                {/*<h1 className="border-b-2 border-dashed border-gray-500">Ze is een vrouw zonder kinderen.</h1>*/}
                {
                  dutchSentence.split(" ").map((word, index) => {
                    return (
                      <span className="text-zinc-800 bg-dashed pb-0.5" key={index}>{word} </span>
                    )
                  })
                }
              </div>
            </div>
          </div>
        </div>
        {/* Droppable content*/}
        <div>
          <Exercise/>
        
        </div>
      </div>
    </main>
  );
}
