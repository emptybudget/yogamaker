import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ReactNode } from 'react';
import { Icon } from './icons';

export type DragHandle = ReactNode;

/** 손잡이(⋮⋮)를 잡고 끌어서 순서 변경. 스크롤과 충돌하지 않도록 손잡이에서만 드래그 시작 */
export function SortableList<T extends { id: string }>({
  items,
  onMove,
  render,
}: {
  items: T[];
  onMove: (from: number, to: number) => void;
  render: (item: T, handle: DragHandle) => ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = items.findIndex((i) => i.id === e.active.id);
    const to = items.findIndex((i) => i.id === e.over!.id);
    if (from >= 0 && to >= 0) onMove(from, to);
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        {items.map((item) => (
          <Row key={item.id} id={item.id}>
            {(handle) => render(item, handle)}
          </Row>
        ))}
      </SortableContext>
    </DndContext>
  );
}

function Row({ id, children }: { id: string; children: (handle: DragHandle) => ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const handle = (
    <button
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      type="button"
      className="grid w-9 shrink-0 cursor-grab touch-none place-items-center self-stretch text-stone-300 active:text-sage-600"
      aria-label="끌어서 순서 바꾸기"
    >
      <Icon name="grip" className="size-4" />
    </button>
  );
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={isDragging ? 'relative z-10 opacity-90 shadow-lg' : ''}
    >
      {children(handle)}
    </div>
  );
}
