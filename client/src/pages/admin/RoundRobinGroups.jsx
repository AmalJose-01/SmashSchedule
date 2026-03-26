import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    Trophy,
    Users,
    Grid3x3,
    Save,
    ArrowLeft,
    Wand2,
    GripVertical
} from "lucide-react";

import {  getTournamentPlayersAPI } from "../../services/admin/adminTeamServices";
import { autoGroupAPI, saveGroupsAPI, getGroupsAPI } from "../../services/admin/roundRobinService";

// --- Draggable Item Component ---
const SortableItem = ({ id, member }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white p-3 mb-2 rounded shadow-sm border border-gray-200 flex items-center justify-between ${isDragging ? "z-50" : ""
                }`}
        >
            <div className="flex items-center gap-3">
                <div {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600">
                    <GripVertical className="w-5 h-5" />
                </div>
                <div>
                    <p className="font-medium text-gray-800">{member.name}</p>
                    <div className="flex gap-2 text-xs text-gray-500">
                        <span className="bg-gray-100 px-1 rounded">Grade: {member.grade || "N/A"}</span>
                        <span>{member.email}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Droppable Group Component ---
const GroupContainer = ({ id, title, members }) => {
    // SortableContext requires ids
    // Ensure IDs are strings
    const memberIds = members.map(m => String(m._id || m.id));

    return (
        <div className="bg-gray-50 rounded-lg p-4 min-h-[300px] flex flex-col h-full">
            <h3 className="font-semibold text-lg mb-3 text-gray-700 flex justify-between items-center">
                {title}
                <span className="text-sm font-normal bg-white px-2 py-1 rounded border">
                    {members.length} Players
                </span>
            </h3>
            <SortableContext
                id={id}
                items={memberIds}
                strategy={verticalListSortingStrategy}
            >
                <div className="flex-1 space-y-2 min-h-[100px]">
                    {members.length === 0 ? (
                        <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-200 rounded flex items-center justify-center h-full">
                            Drop players here
                        </div>
                    ) : (
                        members.map((member) => (
                            <SortableItem key={member._id || member.id} id={String(member._id || member.id)} member={member} />
                        ))
                    )}
                </div>
            </SortableContext>
        </div>
    );
};


const RoundRobinGroups = () => {
    const { id: tournamentId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const tournamentDetail = location.state?.tournamentDetail;

    // State structure: { unassigned: [...], groupA: [...], groupB: [...] }
    const [items, setItems] = useState({
        unassigned: [],
    });

    const [activeId, setActiveId] = useState(null);


 const { data: teamData, isFetching, error } = useQuery({
    queryKey: ["tournamentPlayers", tournamentId],
    queryFn: () => getTournamentPlayersAPI(tournamentId),
    enabled: !!tournamentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onSuccess: (res) => toast.success(`Players loaded!`),
    onError: (error) => {
      console.log("MUTATION ERROR:", error);
      toast.dismiss();
      if (error?.response?.status === 401) {
        toast.error(error.response.data.message || "Session expired");

        dispatch(logOut());
        navigate("/");

        return;
      }

      // Fallback for other errors
      toast.error(error?.response?.data?.message || error.message);
    },
  });


    const { data: groupsData, isLoading: isGroupsLoading } = useQuery({
        queryKey: ["groups", tournamentId],
        queryFn: () => getGroupsAPI(tournamentId),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const isLoading = isFetching || isGroupsLoading;

    // --- Initialize Groups ---
    useEffect(() => {
        if (!teamData?.teams) return;

        if (groupsData?.groups && groupsData.groups.length > 0) {
            // We have existing groups - parse and load them
            const parsedGroups = {};
            const assignedTeamIds = new Set();

            groupsData.groups.forEach((g) => {
                // Normalize to camelCase: "Group A" → "groupA", "Group B" → "groupB", etc.
                let key = g.groupName.replace(/\s+/g, '').replace(/^group(.)/i, (_, c) => `group${c.toUpperCase()}`);

                parsedGroups[key] = g.teams.map(t => {
                    assignedTeamIds.add(t.teamId);
                    // We need grade info, which is in teamData
                    const fullTeam = teamData?.teams?.find(team => team._id === t.teamId);
                    return {
                        _id: t.teamId,
                        id: t.teamId,
                        name: t.name,
                        grade: fullTeam?.grade || "Unknown"
                    };
                });
            });

            // Calculate unassigned
            const unassigned = teamData?.teams?.filter(t => !assignedTeamIds.has(t._id))
                .map(t => ({ ...t, id: t._id, name: t.teamName, grade: t.grade || "Unknown" })) || [];

            setItems({ ...parsedGroups, unassigned });

        } else {
            // No existing groups - initialize all teams as unassigned
            setItems({
                unassigned: teamData.teams.map(t => ({ ...t, id: t._id, name: t.teamName, grade: t.grade || "Unknown" })),
            });
        }
    }, [teamData?.teams, groupsData?.groups]);


    // --- DnD Sensors ---
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const findContainer = (id) => {
        if (id in items) return id;
        return Object.keys(items).find((key) =>
            items[key].find((item) => String(item._id || item.id) === String(id))
        );
    };

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragOver = (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = String(active.id);
        const overId = String(over.id);

        // Find the containers
        const activeContainer = findContainer(activeId);
        const overContainer = findContainer(overId);

        if (
            !activeContainer ||
            !overContainer ||
            activeContainer === overContainer
        ) {
            return;
        }

        setItems((prev) => {
            const activeItems = prev[activeContainer];
            const overItems = prev[overContainer];

            const activeIndex = activeItems.findIndex((i) => String(i._id || i.id) === activeId);
            const overIndex = overItems.findIndex((i) => String(i._id || i.id) === overId);

            let newIndex;
            if (overId in prev) {
                // We're over a container
                newIndex = overItems.length + 1;
            } else {
                const isBelowLastItem =
                    over &&
                    overIndex === overItems.length - 1 &&
                    // draggingRect.offsetTop > overRect.offsetTop + overRect.height;
                    // Simplified: just put it after
                    false;

                const modifier = isBelowLastItem ? 1 : 0;
                newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
            }

            return {
                ...prev,
                [activeContainer]: [
                    ...prev[activeContainer].filter((item) => String(item._id || item.id) !== activeId),
                ],
                [overContainer]: [
                    ...prev[overContainer].slice(0, newIndex),
                    activeItems[activeIndex],
                    ...prev[overContainer].slice(newIndex, prev[overContainer].length),
                ],
            };
        });
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        const activeId = String(active.id);
        const overId = over ? String(over.id) : null;

        const activeContainer = findContainer(activeId);
        const overContainer = overId ? findContainer(overId) : null;

        if (
            !activeContainer ||
            !overContainer ||
            (activeContainer === overContainer && activeId === overId)
        ) {
            setActiveId(null);
            return;
        }

        const activeIndex = items[activeContainer].findIndex((i) => String(i._id || i.id) === activeId);
        const overIndex = items[overContainer].findIndex((i) => String(i._id || i.id) === overId);

        if (activeContainer === overContainer) {
            setItems((prev) => ({
                ...prev,
                [activeContainer]: arrayMove(prev[activeContainer], activeIndex, overIndex),
            }));
        }

        setActiveId(null);
    };


    // --- Handlers ---
    const { mutate: autoGroupMutation, isPending: isAutoGrouping } = useMutation({
        mutationFn: autoGroupAPI,
        onSuccess: (data) => {
            toast.success("Groups generated successfully!");
            // Invalidate groups query to refetch from server
            queryClient.invalidateQueries({ queryKey: ["groups", tournamentId] });
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to generate groups");
        }
    });

    const { mutate: saveGroupsMutation, isPending: isSaving } = useMutation({
        mutationFn: saveGroupsAPI,
        onSuccess: () => {
            toast.success("Groups saved and finalized!");
            // Invalidate groups query before navigation
            queryClient.invalidateQueries({ queryKey: ["groups", tournamentId] });
            navigate(`/match/${tournamentId}`);
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to save groups");
        }
    });

    const handleAutoGroup = () => {
        autoGroupMutation({ tournamentId });
    };

    const handleFinalize = () => {
        const groupKeys = Object.keys(items).filter(k => k !== 'unassigned' && items[k].length > 0);
        if (groupKeys.length === 0) {
            toast.error("No groups set up. Assign players to groups first.");
            return;
        }
        if (items.unassigned?.length > 0) {
            toast.error(`${items.unassigned.length} players are still unassigned. Assign all players before finalizing.`);
            return;
        }

console.log("Finalizing groups:", items);



        saveGroupsMutation({ tournamentId, groups: items });
    };

    const handleAddGroup = () => {
        const groupCount = Object.keys(items).filter(k => k.startsWith('group')).length;
        const nextLetter = String.fromCharCode(65 + groupCount);
        const newKey = `group${nextLetter}`;
        setItems(prev => ({ ...prev, [newKey]: [] }));
    };

    const handleRemoveGroup = (key) => {
        if (!items[key]) return;
        setItems(prev => {
            const newItems = { ...prev };
            // Move items back to unassigned
            newItems.unassigned = [...newItems.unassigned, ...newItems[key]];
            delete newItems[key];
            return newItems;
        });
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading players...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">{tournamentDetail?.tournamentName || "Tournament"}</h1>
                        <p className="text-sm text-gray-500">Round Robin Grouping</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleAutoGroup}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition border border-indigo-200"
                    >
                        <Wand2 className="w-4 h-4" />
                        Auto Group
                    </button>
                    <button
                        onClick={handleFinalize}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm"
                    >
                        <Save className="w-4 h-4" />
                        Finalize & Start
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-100px)]">

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">

                        {/* Unassigned Pool */}
                        <div className="md:col-span-1 h-full">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
                                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-500" />
                                    Unassigned Players
                                    <span className="ml-auto bg-gray-100 text-xs px-2 py-1 rounded-full">{items.unassigned.length}</span>
                                </h2>

                                <div className="flex-1 overflow-y-auto pr-2">
                                    <SortableContext
                                        id="unassigned"
                                        items={items.unassigned.map(m => String(m._id || m.id))}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {items.unassigned.map((member) => (
                                            <SortableItem key={member._id || member.id} id={String(member._id || member.id)} member={member} />
                                        ))}
                                        {items.unassigned.length === 0 && (
                                            <div className="text-center text-gray-400 py-4 italic">No players unassigned</div>
                                        )}
                                    </SortableContext>
                                </div>
                            </div>
                        </div>

                        {/* Groups Area */}
                        <div className="md:col-span-2 h-full overflow-y-auto pr-2">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-gray-800">Tournament Groups</h2>
                                <button
                                    onClick={handleAddGroup}
                                    className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium transition"
                                >
                                    + Add Group
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.keys(items)
                                    .filter(key => key !== 'unassigned')
                                    .sort()
                                    .map(key => (
                                        <div key={key} className="relative group">
                                            <button
                                                onClick={() => handleRemoveGroup(key)}
                                                className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition p-1 hover:bg-red-50 rounded"
                                            >
                                                &times;
                                            </button>
                                            <GroupContainer
                                                id={key}
                                                title={key.replace('group', 'Group ')}
                                                members={items[key]}
                                            />
                                        </div>
                                    ))}
                                {Object.keys(items).filter(k => k !== 'unassigned').length === 0 && (
                                    <div className="md:col-span-2 text-center py-20 bg-gray-50 border-2 border-dashed rounded-xl">
                                        <Grid3x3 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-500">No groups created yet. Use Auto Group or Add Group.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    <DragOverlay>
                        {activeId ? (
                            <div className="bg-white p-3 rounded shadow-lg border border-blue-500 opacity-90 w-64">
                                Moving Player...
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>
        </div>
    );
};

export default RoundRobinGroups;
