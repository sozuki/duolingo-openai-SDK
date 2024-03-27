'use client'
import {DndContext, useDraggable, useDroppable} from "@dnd-kit/core";
import {ReactNode, useState} from "react";

export function Exercise() {
  const containers = ['A', 'B', 'C'];
  const [parent, setParent] = useState(null);
  const draggableMarkup = (
    <Draggable id="draggable">Drag me</Draggable>
  );
  
  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-2">
        
        {/* answer droppable */}
        <div className="flex w-full border-t-2 border-b-2 border-zinc-300 min-h-16">
          {/*  draggable items */}
          <Droppable key={"answer"} id={"answer"}>
            drop here
          </Droppable>
        </div>
        {/* choice droppable */}
        <div className="flex items-center justify-center w-full gap-2 flex-wrap">
          {/* word that I will wrap as the draggable */}
          <Draggable id={"word"} />
          <Draggable id={"word2"} />
        </div>
      </div>
    </DndContext>
  );
  
  function handleDragEnd(event) {
    const {over} = event;
    
    // If the item is dropped over a container, set it as the parent
    // otherwise reset the parent to `null`
    setParent(over ? over.id : null);
  }
}


export function Draggable({children, id}: { children?: ReactNode, id: string }) {
  const {attributes, listeners, setNodeRef, transform} = useDraggable({
    id: id,
  });
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;
  
  
  return (
    <button
      ref={setNodeRef} style={style} {...listeners} {...attributes}
      className="flex items-center justify-center px-4 py-1 text-zinc-700 font-normal text-lg min-h-14 rounded-xl border border-b-4 border-zinc-300 bg-white">
      <span>drink</span>
    </button>
  )
}

export function Droppable({children, id}: { children?: ReactNode, id: string }) {
  const {isOver, setNodeRef} = useDroppable({
    id: id
  })
  return (
    <div ref={setNodeRef} style={isOver ? {color: 'green'} : undefined}
         className="w-full h-full">
      {children}
    </div>
  )
}

export function MessageSvg() {
  return (
    // <SiTeratail className="text-gray-500 -mr-0.5 bg-white" style={{rotate:"-90deg"}}/>
    <svg height="20" viewBox="0 0 18 20" width="18">
      <path className="text-white fill-white"
            d="M2.00358 19.0909H18V0.909058L0.624575 15.9561C-0.682507 17.088 0.198558 19.0909 2.00358 19.0909Z"></path>
      <path className="fill-zinc-200" clipRule="evenodd"
            d="M18 2.48935V0L0.83037 15.6255C-0.943477 17.2398 0.312833 20 2.82143 20H18V18.2916H16.1228H2.82143C1.98523 18.2916 1.56646 17.3716 2.15774 16.8335L16.1228 4.12436L18 2.48935Z"
            fillRule="evenodd"></path>
    </svg>
  )
}

