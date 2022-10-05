import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { rankItem } from "@tanstack/match-sorter-utils";
import Head from "next/head";
import { useCallback, useEffect, useMemo, useState } from "react";
import { isUndefined } from "lodash";
import Backdrop from "../components/Backdrop";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Home() {
  const [dataSpecific, setDataSpecific] = useState([]);
  const [globalFilter, setGlobalFilter] = useState(undefined);
  const [columnFilters, setColumnFilters] = useState([]);
  const [loading, setLoading] = useState(true);
  const columnHelper = createColumnHelper();

  function DebouncedInput({
    value: initialValue,
    onChange,
    debounce = 500,
    ...props
  }) {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
      setValue(initialValue);
    }, [initialValue]);

    useEffect(() => {
      const timeout = setTimeout(() => {
        onChange(value);
      }, debounce);

      return () => clearTimeout(timeout);
    }, [value]);

    return (
      <input
        {...props}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    );
  }

  function Filter({ column, table }) {
    const firstValue = table
      .getPreFilteredRowModel()
      .flatRows[0]?.getValue(column.id);

    const columnFilterValue = column.getFilterValue();

    const sortedUniqueValues = useMemo(
      () =>
        typeof firstValue === "number"
          ? []
          : Array.from(column.getFacetedUniqueValues().keys()).sort(),
      [column.getFacetedUniqueValues()]
    );

    return typeof firstValue === "number" ? (
      <div>
        <div className="flex space-x-2">
          <DebouncedInput
            type="number"
            min={Number(column.getFacetedMinMaxValues()?.[0] ?? "")}
            max={Number(column.getFacetedMinMaxValues()?.[1] ?? "")}
            value={columnFilterValue?.[0] ?? ""}
            onChange={(value) =>
              column.setFilterValue((old) => [value, old?.[1]])
            }
            placeholder={`Min ${
              column.getFacetedMinMaxValues()?.[0]
                ? `(${column.getFacetedMinMaxValues()?.[0]})`
                : ""
            }`}
            className="w-24 border shadow rounded"
          />
          <DebouncedInput
            type="number"
            min={Number(column.getFacetedMinMaxValues()?.[0] ?? "")}
            max={Number(column.getFacetedMinMaxValues()?.[1] ?? "")}
            value={columnFilterValue?.[1] ?? ""}
            onChange={(value) =>
              column.setFilterValue((old) => [old?.[0], value])
            }
            placeholder={`Max ${
              column.getFacetedMinMaxValues()?.[1]
                ? `(${column.getFacetedMinMaxValues()?.[1]})`
                : ""
            }`}
            className="w-24 border shadow rounded"
          />
        </div>
        <div className="h-1" />
      </div>
    ) : (
      <>
        <datalist id={column.id + "list"}>
          {sortedUniqueValues.slice(0, 5000).map((value) => (
            <option value={value} key={value} />
          ))}
        </datalist>
        <DebouncedInput
          type="text"
          value={columnFilterValue ?? ""}
          onChange={(value) => column.setFilterValue(value)}
          placeholder={`Filtrar ... (${column.getFacetedUniqueValues().size})`}
          className="w-36 border shadow rounded"
          list={column.id + "list"}
        />
        <div className="h-1" />
      </>
    );
  }

  const fuzzyFilter = (row, columnId, value, addMeta) => {
    // Rank the item
    if (isUndefined(value)) {
      return true;
    }
    const itemRank = rankItem(row.getValue(columnId), value);

    // Store the itemRank info
    addMeta({
      itemRank,
    });

    // Return if the item should be filtered in/out
    return itemRank.passed;
  };

  const getData = useCallback(async () => {
    const projects = [
      "3dedf866-400a-4e3b-94eb-f6eba7e5ff98",
      "8932251e-40e8-4526-88ec-bf713f620431",
      "a7d3481e-637b-4e7c-a160-b853f31e6fda",
      "be20b561-1c34-4c69-a707-70146a8dd892",
      "46825a3d-e8c6-4f0b-bdb3-8dc2c239b773",
      "6e51d416-754f-4363-a211-3b22229c0186",
      "9536f2c2-59a9-4f9b-a6af-0e8fe932d383",
      "f04e957a-b46a-4baf-975e-5fc02973dc8c",
    ];

    const projectPromises = [];

    projects.forEach(async (project) => {
      projectPromises.push(
        fetch(
          `https://participacion.gobiernoabiertobogota.gov.co/api/${project}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "x-modulo": "0",
              "x-permiso": "100",
              authorization:
                "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c3VhcmlvIjoiamhvbi52aWxsYXJyZWFscEBnbWFpbC5jb20iLCJpYXQiOjE2NjA2NDAyNjAsImV4cCI6MTY2MDY2OTA2MH0.yj15Mvma95UU_ok8FRbC0YIVps0gBHzkcUYnSSq3cbk",
            },
          }
        )
      );
    });

    const projectData = await Promise.all(projectPromises);

    const projectDataJson = await Promise.all(
      projectData.map((project) => project.json())
    )

    setDataSpecific(projectDataJson.map((project) => project[0]));
    setLoading(false)
  }, []);

  useEffect(() => {
    getData();
  }, [getData]);

  // Configs
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Presupuestos Participativos Kennedy 2022',
      },
    },
  };
  
  const graphData = {
    labels: dataSpecific.map((project) => project.nombreOrganizacion.split(" ").slice(0, 3).join(" "),),
    datasets: [
      {
        label: 'Votación',
        data: dataSpecific.map((project) => project.valorRecaudado),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  const columns = [
    columnHelper.accessor("nombreOrganizacion", {
      header: () => "Organización",
      cell: (info) => {
        const org = info.renderValue();
        return (
          <span
            className={`select-none ${
              org.trim() === "ONG DITA MARI" ? "font-bold" : ""
            }`}
          >
            {info.renderValue().trim()}
          </span>
        );
      },
    }),
    columnHelper.accessor("titulo", {
      header: () => "Propuesta",
      cell: (info) => info.renderValue().trim(),
      footer: () => "Total",
    }),
    columnHelper.accessor("valorRecaudado", {
      header: () => "Votos",
      cell: (info) => <span className="text-center">{info.renderValue()}</span>,
      footer: () => {
        return dataSpecific.reduce((acc, item) => {
          return acc + item.valorRecaudado;
        }, 0);
      },
    }),
  ];

  const table = useReactTable({
    data: dataSpecific.map((item) => ({
      ...item,
      temaNombre: item.meta?.tema?.nombre || "",
      metaNombre: item.meta?.nombre || "",
    })),
    columns,
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    state: {
      globalFilter,
      columnFilters,
    },
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
  });

  // Renders
  const renderTable = () => {
    return (
      <table className="w-full">
        <thead className="sticky top-0 z-50 bg-white">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <th key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : (
                      <>
                        <div
                          {...{
                            className: header.column.getCanSort()
                              ? "cursor-pointer select-none"
                              : "",
                            onClick: header.column.getToggleSortingHandler(),
                          }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: " 🔼",
                            desc: " 🔽",
                          }[header.column.getIsSorted()] ?? null}
                        </div>
                        {header.column.getCanFilter() ? (
                          <div>
                            <Filter column={header.column} table={table} />
                          </div>
                        ) : null}
                      </>
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            return (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  return (
                    <td key={cell.id} >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          {table.getFooterGroups().map((footerGroup) => (
            <tr key={footerGroup.id}>
              {footerGroup.headers.map((header) => (
                <th key={header.id} style={{ width: header.column.getSize() }}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.footer,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </tfoot>
      </table>
    );
  };

  if (loading) {
    return <Backdrop show={loading} />;
  } else {
    return (
      <div className="mx-2 p-2">
        <Head>
          <title>Presupuestos Participativos Bogotá</title>
          <meta name="description" content="Generated by create next app" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main className="p-2 block max-w-full overflow-x-scroll overflow-y-hidden">
          <Line options={options} data={graphData} />
          <div className="h-2" />
          <div className="p-2">
            <DebouncedInput
              value={globalFilter ?? ""}
              onChange={(value) => setGlobalFilter(String(value))}
              className="p-2 font-lg shadow border border-block w-full"
              placeholder="Buscar en todas las columnas..."
            />
          </div>
          <div className="relative">{renderTable()}</div>
        </main>
      </div>
    );
  }
}
