import React, { useMemo, useState, useCallback, useEffect } from "react";
import {
  Button,
  Card,
  Group,
  ActionIcon,
  Text,
  Stack,
  Title,
  Modal,
  TextInput,
  Checkbox,
  Progress,
  Box,
  Tooltip,
  SegmentedControl,
  Chip,
} from "@mantine/core";
import {
  useReactTable,
  createColumnHelper,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  IconTrash,
  IconPlus,
  IconDownload,
  IconDeviceFloppy,
  IconEdit,
  IconHeading,
  IconPencil,
  IconX,
  IconChevronRight,
  IconChevronDown,
} from "@tabler/icons-react";

const columnHelper = createColumnHelper();

const MONTHS = [
  { key: "jan", label: "Jan", type: "checkbox" },
  { key: "feb", label: "Feb", type: "checkbox" },
  { key: "mar", label: "Mar", type: "checkbox" },
  { key: "apr", label: "Apr", type: "checkbox" },
  { key: "may", label: "May", type: "checkbox" },
  { key: "jun", label: "Jun", type: "checkbox" },
  { key: "jul", label: "Jul", type: "checkbox" },
  { key: "aug", label: "Aug", type: "checkbox" },
  { key: "sep", label: "Sep", type: "checkbox" },
  { key: "oct", label: "Oct", type: "checkbox" },
  { key: "nov", label: "Nov", type: "checkbox" },
  { key: "dec", label: "Dec", type: "checkbox" },
];

const initialData = [
  { id: "h-1", isHeading: true, task: "Roof & Exterior" },
  {
    id: "t-1",
    parent: "h-1",
    isHeading: false,
    task: "Inspect roof",
    jan: true,
    feb: false,
    mar: true,
    apr: false,
  },
  {
    id: "t-2",
    parent: "h-1",
    isHeading: false,
    task: "Clean gutters",
    jan: false,
    feb: false,
    mar: true,
    apr: true,
  },
  { id: "h-2", isHeading: true, task: "HVAC" },
  {
    id: "t-3",
    parent: "h-2",
    isHeading: false,
    task: "Replace filter",
    jan: true,
    feb: true,
    mar: true,
    apr: true,
  },
];

export default function MaintenanceTable() {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem("maintenance-data-v1");
    return saved ? JSON.parse(saved) : initialData;
  });

  // Modal state
  const [editingIndex, setEditingIndex] = useState(null); // index in data
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRow, setModalRow] = useState(null); // copy of row being edited
  const [colors, setColors] = useState({
    main: "#E96E1B",
    // main: "purple",
    secondary: "grey",
    delete: "red",
  });
  const [wantEdit, setWantEdit] = useState(false);
  const [hoverRow, setHoverRow] = useState(null);
  const [hiddenGroups, setHiddenGroups] = useState([]);

  // stable updater for single cell (used for month checkboxes)
  const updateCell = useCallback((rowIndex, columnId, value) => {
    setData((prev) => {
      const copy = prev.map((r) => ({ ...r }));
      copy[rowIndex] = { ...copy[rowIndex], [columnId]: value };
      return copy;
    });
  }, []);

  const addTaskBelow = useCallback((index) => {
    const newRow = {
      id: `t-${Date.now()}`,
      isHeading: false,
      task: "New task",
      parent: data[index].parent,
      ...MONTHS.reduce((acc, m) => ({ ...acc, [m.key]: false }), {}),
    };
    setData((prev) => {
      const copy = [...prev];
      copy.splice(index + 1, 0, newRow);
      return copy;
    });
  }, []);

  const addHeadingBelow = useCallback((index) => {
    const newRow = { id: `h-${Date.now()}`, isHeading: true, task: "New heading" };
    setData((prev) => {
      const copy = [...prev];
      copy.splice(index + 1, 0, newRow);
      return copy;
    });
  }, []);

  const removeRow = useCallback((index) => {
    setData((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const saveToLocal = useCallback(() => {
    localStorage.setItem("maintenance-data-v1", JSON.stringify(data));
  }, [data]);

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `maintenance-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  // ------- compute per-column progress (ignore heading rows) -------
  const progressByMonth = useMemo(() => {
    // filter to task rows only
    const taskRows = data.filter((r) => !r.isHeading);
    const total = taskRows.length;
    const map = {};
    MONTHS.forEach((m) => {
      if (total === 0) {
        map[m.key] = 0;
      } else {
        const done = taskRows.reduce((acc, row) => (row[m.key] ? acc + 1 : acc), 0);
        map[m.key] = Math.round((done / total) * 100);
      }
    });
    return map;
  }, [data]);

  // ------- columns: include month header that shows progress -------
  const columns = useMemo(() => {
    const base = [
      columnHelper.display({
        id: "task",
        header: "Item / Task",
        cell: ({ row }) => {
          if (row.original.isHeading) {
            return <Text weight={700}>{row.original.task}</Text>;
          }
          return <Text>{row.original.task}</Text>;
        },
      }),
    ];

    const monthCols = MONTHS.map((m) =>
      columnHelper.accessor((row) => row[m.key], {
        id: m.key,
        // header shows label + percent + progress bar
        header: () => {
          const pct = progressByMonth[m.key] ?? 0;
          return (
            <Box sx={{ width: "100%", maxWidth: 120 }}>
              <Group justify="space-between" spacing={4}>
                <Text size="sm" weight={600}>
                  {m.label}
                </Text>
                <Text size="xs" color="dimmed">
                  {pct}%
                </Text>
              </Group>
              <Progress value={pct} size="xs" mt={4} color={colors.main} />
            </Box>
          );
        },
        cell: ({ row }) => {
          if (row.original.isHeading) return null;

          // inline checkbox
          return (
            // <Checkbox
            //   checked={!!row.original[m.key]}
            //   onChange={(e) => updateCell(row.index, m.key, e.currentTarget.checked)}
            //   size="sm"
            //   color={colors.main}
            //   radius={"xl"}
            // />
            <Chip
              size="xs"
              color={colors.main}
              radius="xl"
              checked={!!row.original[m.key]}
              onClick={() => updateCell(row.index, m.key, !row.original[m.key])}
            >
              {!!row.original[m.key] ? 'SM' : '---' }
            </Chip>
          );
        },
        meta: { monthKey: m.key },
      })
    );

    const actions = columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const rowIndex = row.index;
        return (
          <>
            {wantEdit && (
              <Group spacing={4} position="right" noWrap>
                <ActionIcon 
                  title="Edit row" 
                  size="sm" 
                  onClick={() => openEditModal(rowIndex)}
                  color={colors.main}
                  variant="subtle"
                >
                  <IconEdit size={16} />
                </ActionIcon>
  
                <Tooltip label="New task below" position="top">
                  <ActionIcon 
                    title="Add task below" 
                    size="sm" 
                    onClick={() => addTaskBelow(rowIndex)}
                    color={colors.secondary}
                    variant="subtle"
                  >
                    <IconPlus size={16} />
                  </ActionIcon>
                </Tooltip>
  
                <Tooltip label="New heading below" position="top">
                  <ActionIcon
                    title="Add heading below"
                    size="sm"
                    onClick={() => addHeadingBelow(rowIndex)}
                    color={colors.secondary}
                    variant="subtle"
                  >
                    <IconHeading size={16} />
                  </ActionIcon>
                </Tooltip>
  
                <ActionIcon
                  color={colors.delete}
                  title="Delete row"
                  size="sm"
                  onClick={() => removeRow(rowIndex)}
                  variant="subtle"
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            )}
          </>
        );
      },
    });

    const cols = [...base, ...monthCols];
    if (wantEdit) cols.push(actions);
    return cols;
    // note: columns depend on progressByMonth and stable callbacks
  }, [addTaskBelow, addHeadingBelow, removeRow, updateCell, progressByMonth, wantEdit, colors]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // ------- modal handlers -------
  const openEditModal = useCallback(
    (rowIndex) => {
      setEditingIndex(rowIndex);
      setModalRow({ ...data[rowIndex] });
      setModalOpen(true);
    },
    [data]
  );

  // useEffect(() => {
  //   console.log("hiddenGroups changed:", hiddenGroups);
  // }, [hiddenGroups]);

  // useEffect(() => {
  //   data.forEach((row) => {
  //     console.log("Row:", row);
  //     if (!row.isHeading && hiddenGroups.includes(row.parent)) {
  //       console.log("Hiding row:", row.task);
  //     }
  //   });
  // }, [hiddenGroups, data]);

  const saveModal = useCallback(() => {
    if (editingIndex == null) {
      setModalOpen(false);
      return;
    }
    setData((prev) => {
      const copy = prev.map((r) => ({ ...r }));
      copy[editingIndex] = { ...modalRow };
      return copy;
    });
    setModalOpen(false);
    setEditingIndex(null);
    setModalRow(null);
  }, [editingIndex, modalRow]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingIndex(null);
    setModalRow(null);
  }, []);

  return (
    <Card shadow="sm" p="md" radius="md">
      <Stack spacing="md">
        <Group justify="space-between">
          <Group>
            <Title order={3}>Maintenance Tracker</Title>
            <Tooltip label={wantEdit ? "Discard" : "Edit rows"} position="top">
              <ActionIcon
                variant="subtle"
                color={colors.secondary}
                size="md"
                onClick={() => wantEdit ? setWantEdit(false) : setWantEdit(true)}
              >
                {wantEdit ? <IconX size={20} /> : <IconPencil size={20} />}
              </ActionIcon>
            </Tooltip>
            {wantEdit && (
              <Tooltip label={"Save"} position="top">
                <ActionIcon
                  variant="subtle"
                  color={colors.main}
                  size="md"
                  onClick={() => {
                    saveToLocal();
                    setWantEdit(false);
                  }}
                >
                  <IconDeviceFloppy size={20} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
          <Group>
            <Tooltip label="Export JSON" position="top">
              <ActionIcon
                variant="subtle"
                color={colors.main}
                size="md"
                onClick={exportJson}
              >
                <IconDownload size={20} />
              </ActionIcon>
            </Tooltip>
            {/* {wantEdit && (
              <>
                <Tooltip label="New Task" position="top">
                  <Button
                    onClick={() =>
                      setData((prev) => [
                        ...prev,
                        {
                          id: `t-${Date.now()}`,
                          isHeading: false,
                          task: "New task",
                          ...MONTHS.reduce((acc, m) => ({ ...acc, [m.key]: false }), {}),
                        },
                      ])
                    }
                    color={colors.main}
                    leftSection={<IconPlus size={20} />}
                    radius={"md"}
                  >
                    Add Task
                  </Button>
                </Tooltip>
                <Button
                  variant="outline"
                  onClick={() =>
                    setData((prev) => [
                      ...prev,
                      { id: `h-${Date.now()}`, isHeading: true, task: "New heading" },
                    ])
                  }
                  color={colors.main}
                  radius={"md"}
                  leftSection={<IconHeading size={20} />}
                >
                  Add Heading
                </Button>
              </>
            )} */}
          </Group>
        </Group>

        {/* table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      style={{
                        textAlign: "left",
                        padding: "8px",
                        borderBottom: "1px solid var(--mantine-color-gray-4, #e9ecef)",
                        verticalAlign: "bottom",
                        minWidth: header.column.columnDef?.meta?.width ?? 80,
                      }}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody>
              {table.getRowModel().rows.map((row) => {
                // full-width heading row
                if (row.original.isHeading) {
                  return (
                    <tr key={row.id} style={{ backgroundColor: hoverRow === row.index ? "rgba(0, 0, 0, 0.34)" : undefined }} onMouseOver={() => setHoverRow(row.index)}>
                      <td
                        colSpan={table.getAllColumns().length}
                        style={{
                          padding: "8px",
                          background: "#1f1f1f",
                          // fontWeight: 700,
                        }}
                      >
                        <Group position="apart" noWrap>
                          <Group>
                            <ActionIcon
                              size="sm"
                              onClick={() => {
                                setHiddenGroups((prev) =>
                                  prev.includes(row.original.id)
                                    ? prev.filter((id) => id !== row.original.id)
                                    : [...prev, row.original.id]
                                );
                              }}
                              color={colors.secondary}
                              variant="subtle"
                              style={{
                                transform: hiddenGroups.includes(row.original.id)
                                  ? "rotate(-90deg)"
                                  : "rotate(0deg)",
                                transition: "transform 0.2s ease",
                              }}
                            >
                              <IconChevronDown size={16} />
                            </ActionIcon>
                            {/* <ActionIcon 
                              size="sm" 
                              onClick={() => {
                                if (hiddenGroups.includes(row.original.id)) {
                                  setHiddenGroups((prev) => prev.filter(id => id !== row.original.id));
                                } else {
                                  setHiddenGroups((prev) => [...prev, row.original.id]);
                                }
                                console.log(hiddenGroups)
                                console.log(row.original.id)
                              }}
                              color={colors.secondary}
                              variant="subtle"
                            >
                              <IconChevronRight size={16} />
                            </ActionIcon> */}
                            <Text fw={800}>{row.original.task}</Text>
                          </Group>
                          {/* small controls for heading row */}
                          {wantEdit && (
                            <Group spacing={6}>
                              <ActionIcon 
                                size="sm" 
                                onClick={() => openEditModal(row.index)}
                                color={colors.main}
                                variant="subtle"
                              >
                                <IconEdit size={16} />
                              </ActionIcon>
                              <ActionIcon 
                                size="sm" 
                                onClick={() => addTaskBelow(row.index)}
                                color={colors.secondary}
                                variant="subtle"
                              >
                                <IconPlus size={16} />
                              </ActionIcon>
                              <ActionIcon
                                size="sm" 
                                onClick={() => removeRow(row.index)}
                                color={colors.delete}
                                variant="subtle"
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Group>
                          )}
                        </Group>
                      </td>
                    </tr>
                  );
                }

                if (!row.original.isHeading && hiddenGroups.includes(row.original.parent)) return null;

                return (
                  // <tr key={row.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                  <tr key={row.id} style={{ backgroundColor: hoverRow === row.index ? "#2b2b2b" : undefined, borderBottom: "1px solid rgba(0,0,0,0.04)" }} onMouseOver={() => setHoverRow(row.index)} onMouseOut={() => setHoverRow(null)}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} style={{ padding: "6px 8px", verticalAlign: "middle" }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Group justify="space-between">
          <Text size="xs" color="dimmed">
            Tip: Column progress shows percent of tasks completed for that month.
          </Text>
          <Text size="xs" color="dimmed">
            Toggle checkboxes inline or use the Edit button to change task text.
          </Text>
        </Group>
      </Stack>

      {/* Edit modal */}
      <Modal 
        opened={modalOpen} 
        onClose={closeModal} 
        size="lg" 
        centered
        title={<Text size={'28px'} fw={700}>Edit row</Text>}
      >
        {modalRow ? (
          <Stack spacing="sm">
            <Stack gap={4}>
              <Text fw={400} size={'14px'}>
                Row type
              </Text>
              <SegmentedControl
                value={modalRow.isHeading ? "heading" : "task"}
                onChange={(v) => setModalRow((r) => ({ ...r, isHeading: v === "heading" }))}
                data={[
                  { label: "Task", value: "task" },
                  { label: "Heading", value: "heading" },
                ]}
                radius={"md"}
                color={colors.main}
              />
            </Stack>
            <TextInput
              label="Text"
              value={modalRow.task ?? ""}
              onChange={(e) => setModalRow((r) => ({ ...r, task: e.target.value }))}
              radius={"md"}
              // variant="filled"
              variant="default"
              styles={{
                input: {
                  borderColor: "transparent",
                },
              }}
            />
            {/* {modalRow.isHeading ? (
              <TextInput
                label="Heading text"
                value={modalRow.task ?? ""}
                onChange={(e) => setModalRow((r) => ({ ...r, task: e.target.value }))}
              />
            ) : (
              <TextInput
                label="Task text"
                value={modalRow.task ?? ""}
                onChange={(e) => setModalRow((r) => ({ ...r, task: e.target.value }))}
              />
            )} */}
            {/* <Checkbox
              label="This row is a heading"
              checked={!!modalRow.isHeading}
              onChange={(e) => setModalRow((r) => ({ ...r, isHeading: e.currentTarget.checked }))}
              color={colors.main}
            /> */}
            <Text weight={600} size="sm">Months</Text>
            <Group>
              {MONTHS.map((m) => (
                <Checkbox
                  key={m.key}
                  label={m.label}
                  checked={!!modalRow[m.key]}
                  onChange={(e) => setModalRow((r) => ({ ...r, [m.key]: e.currentTarget.checked }))}
                  color={colors.main}
                />
              ))}
            </Group>

            <Group justify="flex-end" mt="md">
              <Button 
                variant="subtle" 
                onClick={closeModal}
                radius={"md"}
                color={colors.secondary}
              >
                Cancel
              </Button>
              <Button 
                onClick={saveModal}
                radius={"md"}
                color={colors.main}
                variant="filled"
              >
                Save
              </Button>
            </Group>
          </Stack>
        ) : null}
      </Modal>
    </Card>
  );
}
