import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Clock, CheckCircle2, Loader2, AlertTriangle, Trash2, Play } from "lucide-react";

const COLUMNS = [
  { id: "pending", title: "Pending", Icon: Clock, accent: "text-sky-400", dot: "bg-sky-400" },
  { id: "running", title: "In-Progress", Icon: Loader2, accent: "text-amber-400", dot: "bg-amber-400" },
  { id: "done", title: "Completed", Icon: CheckCircle2, accent: "text-emerald-400", dot: "bg-emerald-400" },
  { id: "failed", title: "Failed", Icon: AlertTriangle, accent: "text-red-400", dot: "bg-red-400" },
];

export default function TaskKanban({ tasks, onMove, onAdvance, onRemove }) {
  const [draggingId, setDraggingId] = useState(null);

  const onDragStart = (start) => setDraggingId(start.draggableId);
  const onDragEnd = (result) => {
    setDraggingId(null);
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    onMove(draggingId, destination.droppableId);
  };

  return (
    <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
        {COLUMNS.map((col) => {
          const items = tasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              className="snap-start shrink-0 w-72 sm:w-80 rounded-2xl border border-zinc-800 bg-zinc-900/30 overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <div className={`flex items-center gap-2 text-sm font-medium ${col.accent}`}>
                  <col.Icon className={`w-4 h-4 ${col.id === "running" ? "animate-spin" : ""}`} />
                  {col.title}
                </div>
                <span className="text-xs text-zinc-500 bg-zinc-800 rounded-full px-2 py-0.5">{items.length}</span>
              </div>
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`p-2.5 space-y-2.5 min-h-[140px] flex-1 transition-colors ${
                      snapshot.isDraggingOver ? "bg-emerald-400/5" : ""
                    }`}
                  >
                    {items.length === 0 && !snapshot.isDraggingOver && (
                      <div className="text-xs text-zinc-600 text-center py-8">Drop tasks here</div>
                    )}
                    {items.map((t, index) => (
                      <Draggable key={t.id} draggableId={t.id} index={index}>
                        {(p, s) => (
                          <div
                            ref={p.innerRef}
                            {...p.draggableProps}
                            {...p.dragHandleProps}
                            className={`rounded-xl border bg-zinc-900/70 p-3.5 group cursor-grab active:cursor-grabbing ${
                              s.isDragging ? "border-emerald-400/50 shadow-xl shadow-black/40 rotate-1" : "border-zinc-800"
                            } ${draggingId === t.id ? "opacity-90" : ""}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="text-sm text-zinc-200 leading-snug">{t.title}</div>
                              <PriorityTag p={t.priority} />
                            </div>
                            <div className="text-xs text-zinc-500 mt-1.5">
                              {t.agent || "Unassigned"} · {t.category}
                            </div>
                            {t.revenue_impact > 0 && (
                              <div className="text-xs text-emerald-400 mt-1">+${t.revenue_impact} impact</div>
                            )}
                            <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              {t.status !== "done" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAdvance(t);
                                  }}
                                  className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                                >
                                  <Play className="w-3 h-3" /> Advance
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemove(t);
                                }}
                                className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-300"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}

function PriorityTag({ p }) {
  const map = { high: "text-red-400 bg-red-400/10", medium: "text-amber-400 bg-amber-400/10", low: "text-zinc-500 bg-zinc-800" };
  return <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${map[p] || map.low}`}>{p}</span>;
}