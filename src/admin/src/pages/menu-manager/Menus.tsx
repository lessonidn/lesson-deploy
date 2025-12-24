import { useEffect, useState } from 'react'
import { supabase } from '../../../../lib/supabase'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { DragEndEvent } from '@dnd-kit/core'

type MenuSource = 'manual' | 'category' | 'sub_category'

type Menu = {
  id: string
  label: string
  parent_id: string | null
  order_index: number   // ✅ gunakan order_index, bukan order
  source: MenuSource
}

export default function Menus() {
  const [menus, setMenus] = useState<Menu[]>([])
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // ← gerak dikit langsung drag
      },
    })
  )

  useEffect(() => {
    loadMenus()
  }, [])

  async function loadMenus() {
    const { data } = await supabase
      .from('menus')
      .select('id, label, parent_id, order_index, source')
      .or('source.eq.manual,source.is.null')
      .order('parent_id', { nullsFirst: true })
      .order('order_index')

    setMenus(data || [])
  }

  /* ================= DRAG END ================= */
  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeMenu = menus.find((m: Menu) => m.id === active.id)
    const overMenu = menus.find((m: Menu) => m.id === over.id)
    if (!activeMenu || !overMenu) return

    /* =========================
        CASE 1: MENU UTAMA
        ========================= */
    if (activeMenu.parent_id === null && overMenu.parent_id === null) {
      const parents = menus
        .filter((m: Menu) => m.parent_id === null)
        .sort((a: Menu, b: Menu) => a.order_index - b.order_index)

      const oldIndex = parents.findIndex((m: Menu) => m.id === active.id)
      const newIndex = parents.findIndex((m: Menu) => m.id === over.id)

      const reordered = arrayMove(parents, oldIndex, newIndex)

      // Update state
      const updatedMenus = menus.map((m: Menu) => {
        const idx = reordered.findIndex((r: Menu) => r.id === m.id)
        return idx !== -1 ? { ...m, order_index: idx + 1 } : m
      })

      setMenus(updatedMenus)

      // Persist ke DB
      for (let i = 0; i < reordered.length; i++) {
        await supabase
          .from('menus')
          .update({ order_index: i + 1 })
          .eq('id', reordered[i].id)
      }

      return
    }

    /* =========================
        CASE 2: SUBMENU (SAMA / PINDAH PARENT)
        ========================= */

    // ❌ menu utama tidak boleh jadi child
    if (activeMenu.parent_id === null && overMenu.parent_id !== null) return

    let newParentId = overMenu.parent_id

    // submenu dipindah ke menu utama
    if (activeMenu.parent_id !== null && overMenu.parent_id === null) {
      newParentId = overMenu.id
    }

    const siblings = menus.filter(
      (m: Menu) => m.parent_id === newParentId && m.id !== activeMenu.id
    )

    const overIndex = siblings.findIndex((m: Menu) => m.id === over.id)

    const finalSiblings = [...siblings]
    finalSiblings.splice(
      overIndex === -1 ? finalSiblings.length : overIndex,
      0,
      { ...activeMenu, parent_id: newParentId }
    )

    // Update state
    const updatedMenus = menus.map((m: Menu) => {
      const idx = finalSiblings.findIndex((s: Menu) => s.id === m.id)
      if (m.id === activeMenu.id) {
        return { ...m, parent_id: newParentId, order_index: idx + 1 }
      }
      return idx !== -1 ? { ...m, order: idx + 1 } : m
    })

    setMenus(updatedMenus)

    // Persist ke DB
    for (let i = 0; i < finalSiblings.length; i++) {
      await supabase
        .from('menus')
        .update({
          parent_id: newParentId,
          order_index: i + 1,
        })
        .eq('id', finalSiblings[i].id)
    }
  }

  /* ================= RENDER ================= */

  const parents = menus.filter((m: Menu) => m.parent_id === null)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">
        Menu Manager (Advanced Drag & Drop)
      </h1>

      <div className="bg-white border rounded-xl p-4 space-y-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={parents.map((p: Menu) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            {parents.map((parent: Menu) => (
              <div key={parent.id}>
                <SortableItem menu={parent} />

                {/* SUB MENU */}
                <div className="ml-6 mt-2 space-y-1">
                  <SortableContext
                    items={menus
                      .filter((m: Menu) => m.parent_id === parent.id)
                      .map((m: Menu) => m.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {menus
                      .filter((m: Menu) => m.parent_id === parent.id)
                      .map((child: Menu) => (
                        <SortableItem
                          key={child.id}
                          menu={child}
                          isChild
                        />
                      ))}
                  </SortableContext>
                </div>
              </div>
            ))}
          </SortableContext>
        </DndContext>
      </div>

      <p className="text-xs text-gray-500">
        • Drag submenu ke menu utama lain untuk pindah parent  
        • Drag di dalam parent untuk reorder  
        • Menu otomatis tidak ikut drag
      </p>
    </div>
  )
}

/* ================= SORTABLE ITEM ================= */

function SortableItem({
  menu,
  isChild,
}: {
  menu: Menu
  isChild?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: menu.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between rounded border px-3 py-2 mb-1
        ${isChild ? 'bg-gray-50 text-sm' : 'bg-white font-medium'}`}
    >
      <div className="flex items-center gap-2">
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing select-none
                        text-gray-400 hover:text-gray-700 text-lg"
          title="Drag menu"
        >
          ☰
        </span>
        {menu.label}
      </div>

      <span className="text-xs text-gray-400">order: {menu.order_index}</span>
    </div>
  )
}