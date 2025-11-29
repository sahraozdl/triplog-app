"use client";

import { useState } from "react";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ImageRun,
  HeadingLevel,
  BorderStyle,
  AlignmentType,
  VerticalAlign,
} from "docx";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import {
  DailyLogFormState,
  AdditionalLog,
  TravelLog,
  WorkTimeLog,
  AccommodationLog,
} from "@/app/types/DailyLog";
import { Trip } from "@/app/types/Trip";

interface Props {
  trip: Trip;
  logs: DailyLogFormState[];
}

async function fetchImageBuffer(
  url: string,
): Promise<{ buffer: ArrayBuffer; width: number; height: number } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();

    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(blob);
      img.onload = () => {
        resolve({ buffer, width: img.width, height: img.height });
      };
      img.onerror = () => resolve(null);
    });
  } catch (e) {
    console.error("Image fetch error:", e);
    return null;
  }
}

function formatMultiLineText(text: string): TextRun[] {
  if (!text) return [new TextRun("-")];
  return text.split("\n").map(
    (line, index) =>
      new TextRun({
        text: line,
        break: index > 0 ? 1 : 0,
      }),
  );
}

export default function DownloadDocxButton({ trip, logs }: Props) {
  const [generating, setGenerating] = useState(false);

  const fetchAttendantDetails = async (userIds: string[]) => {
    try {
      const res = await fetch("/api/users/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds, detailed: true }),
      });
      const data = await res.json();
      return data.users || {};
    } catch {
      return {};
    }
  };

  const generateDocx = async () => {
    setGenerating(true);

    try {
      const attendantIds = trip.attendants?.map((a) => a.userId) || [];
      const userDetailsMap = await fetchAttendantDetails(attendantIds);

      const users = attendantIds.map((id) => {
        const user = userDetailsMap[id];
        const details = user?.employeeDetail || {};
        return {
          id: id,
          name: user?.name || "Unknown User",
          jobTitle: details.jobTitle || "-",
          department: details.department || "-",
          identityNumber: details.identityNumber || "-",
          homeAddress: [
            details.homeAddress?.street,
            details.homeAddress?.city,
            details.homeAddress?.country,
          ]
            .filter(Boolean)
            .join(", "),
          workAddress: [
            details.workAddress?.street,
            details.workAddress?.city,
            details.workAddress?.country,
          ]
            .filter(Boolean)
            .join(", "),
        };
      });

      const children: any[] = [];

      children.push(
        new Paragraph({
          text: trip.basicInfo.title,
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "TRIP REPORT",
              bold: true,
              size: 24,
              color: "666666",
            }),
          ],
          spacing: { after: 400 },
        }),
      );

      const summaryTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: "Dates:", bold: true })],
                  }),
                ],
                width: { size: 25, type: WidthType.PERCENTAGE }, // %25
                shading: { fill: "EEEEEE" },
              }),
              new TableCell({
                children: [
                  new Paragraph(
                    `${new Date(trip.basicInfo.startDate).toLocaleDateString()} - ${trip.basicInfo.endDate ? new Date(trip.basicInfo.endDate).toLocaleDateString() : "Ongoing"}`,
                  ),
                ],
                width: { size: 75, type: WidthType.PERCENTAGE }, // %75
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: "Location:", bold: true })],
                  }),
                ],
                width: { size: 25, type: WidthType.PERCENTAGE },
                shading: { fill: "EEEEEE" },
              }),
              new TableCell({
                children: [
                  new Paragraph(
                    [trip.basicInfo.country, trip.basicInfo.resort]
                      .filter(Boolean)
                      .join(", "),
                  ),
                ],
                width: { size: 75, type: WidthType.PERCENTAGE },
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Description:", bold: true }),
                    ],
                  }),
                ],
                width: { size: 25, type: WidthType.PERCENTAGE },
                shading: { fill: "EEEEEE" },
              }),
              new TableCell({
                children: [new Paragraph(trip.basicInfo.description || "-")],
                width: { size: 75, type: WidthType.PERCENTAGE },
              }),
            ],
          }),
        ],
      });
      children.push(summaryTable);
      children.push(new Paragraph({ text: "", spacing: { after: 400 } }));

      children.push(
        new Paragraph({
          text: "Participant Details",
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 100 },
        }),
      );

      const userTableRows = [
        new TableRow({
          tableHeader: true,
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "Name", bold: true })],
                }),
              ],
              width: { size: 20, type: WidthType.PERCENTAGE }, // %20
              shading: { fill: "D9E2F3" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "Title / Dept", bold: true })],
                }),
              ],
              width: { size: 25, type: WidthType.PERCENTAGE }, // %25
              shading: { fill: "D9E2F3" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "ID No", bold: true })],
                }),
              ],
              width: { size: 15, type: WidthType.PERCENTAGE }, // %15
              shading: { fill: "D9E2F3" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Addresses (Home / Work)",
                      bold: true,
                    }),
                  ],
                }),
              ],
              width: { size: 40, type: WidthType.PERCENTAGE }, // %40
              shading: { fill: "D9E2F3" },
            }),
          ],
        }),
        ...users.map(
          (u) =>
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: u.name, bold: true })],
                    }),
                  ],
                  width: { size: 20, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [
                    new Paragraph(u.jobTitle),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: u.department,
                          size: 16,
                          color: "666666",
                        }),
                      ],
                    }),
                  ],
                  width: { size: 25, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph(u.identityNumber)],
                  width: { size: 15, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: "H: ", bold: true }),
                        new TextRun(u.homeAddress || "-"),
                      ],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({ text: "W: ", bold: true }),
                        new TextRun(u.workAddress || "-"),
                      ],
                    }),
                  ],
                  width: { size: 40, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
        ),
      ];

      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: userTableRows,
        }),
      );
      children.push(new Paragraph({ text: "", spacing: { after: 400 } }));
      const logsByType: Record<string, DailyLogFormState[]> = {
        travel: [],
        worktime: [],
        accommodation: [],
        additional: [],
      };
      logs.forEach((l) => {
        const type = l.itemType || "additional";
        if (logsByType[type]) logsByType[type].push(l);
      });

      const addModuleTable = async (
        title: string,
        type: string,
        renderContent: (log: any) => any[],
      ) => {
        const moduleLogs = logsByType[type];
        if (!moduleLogs || moduleLogs.length === 0) return;

        children.push(
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
        );
        // table widths are not working
        const tableRows = [
          new TableRow({
            tableHeader: true,
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Date / Time", bold: true }),
                    ],
                  }),
                ],
                width: { size: 20, type: WidthType.PERCENTAGE }, // %20
                shading: { fill: "E0E0E0" },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: "User", bold: true })],
                  }),
                ],
                width: { size: 20, type: WidthType.PERCENTAGE }, // %20
                shading: { fill: "E0E0E0" },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Details & Files", bold: true }),
                    ],
                  }),
                ],
                width: { size: 60, type: WidthType.PERCENTAGE }, // %60
                shading: { fill: "E0E0E0" },
              }),
            ],
          }),
        ];

        for (const log of moduleLogs) {
          const dateStr = new Date(log.dateTime).toLocaleDateString();
          const timeStr = new Date(log.dateTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

          const owner =
            users.find((u) => u.id === log.userId)?.name || "Unknown";
          const contentParagraphs = renderContent(log);

          const files = [
            ...(log.files || []),
            ...((log as AdditionalLog).uploadedFiles || []),
          ];
          const fileParagraphs: Paragraph[] = [];

          if (files.length > 0) {
            fileParagraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: "\nAttachments:",
                    bold: true,
                    size: 16,
                    color: "888888",
                  }),
                ],
              }),
            );

            for (const f of files) {
              const isImage =
                f.type.startsWith("image/") ||
                f.url.match(/\.(jpeg|jpg|gif|png)$/i);
              if (isImage) {
                const imgData = await fetchImageBuffer(f.url);
                if (imgData) {
                  const maxWidth = 250;
                  let finalWidth = imgData.width;
                  let finalHeight = imgData.height;
                  if (finalWidth > maxWidth) {
                    const ratio = maxWidth / finalWidth;
                    finalWidth = maxWidth;
                    finalHeight = finalHeight * ratio;
                  }

                  fileParagraphs.push(
                    new Paragraph({
                      children: [
                        new ImageRun({
                          data: imgData.buffer,
                          transformation: {
                            width: finalWidth,
                            height: finalHeight,
                          },
                          type: "png",
                        }),
                        new TextRun({ text: `  [${f.name}]`, size: 14 }),
                      ],
                    }),
                  );
                }
              } else {
                fileParagraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "📄 " + f.name,
                        color: "0000FF",
                        underline: {},
                      }),
                      new TextRun({
                        text: ` (${f.url})`,
                        size: 14,
                        color: "888888",
                      }),
                    ],
                  }),
                );
              }
            }
          }

          tableRows.push(
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: dateStr })],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: timeStr,
                          size: 16,
                          color: "666666",
                        }),
                      ],
                    }),
                  ],
                  width: { size: 20, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph(owner)],
                  width: { size: 20, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [...contentParagraphs, ...fileParagraphs],
                  width: { size: 60, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
          );
        }

        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows,
          }),
        );
        children.push(new Paragraph({ text: "" }));
      };
      await addModuleTable("1. Travel", "travel", (l: TravelLog) => [
        new Paragraph({
          children: [
            new TextRun({ text: l.travelReason || "Travel", bold: true }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Route: ", bold: true }),
            new TextRun(
              `${l.departureLocation || "?"} -> ${l.destination || "?"}`,
            ),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Distance: ", bold: true }),
            new TextRun(`${l.distance ? l.distance + " km" : "-"}`),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Vehicle: ", bold: true }),
            new TextRun(`${l.vehicleType || "-"}`),
          ],
        }),
      ]);

      await addModuleTable("2. Work Time", "worktime", (l: WorkTimeLog) => [
        new Paragraph({
          children: [
            new TextRun({
              text: `Time: ${l.startTime} - ${l.endTime}`,
              bold: true,
            }),
          ],
        }),
        ...formatMultiLineText(l.description || "-").map(
          (tr) => new Paragraph({ children: [tr] }),
        ),
      ]);

      await addModuleTable(
        "3. Accommodation",
        "accommodation",
        (l: AccommodationLog) => [
          new Paragraph({
            children: [
              new TextRun({ text: l.accommodationType || "Hotel", bold: true }),
            ],
          }),
          new Paragraph(`Overnight: ${l.overnightStay}`),
          new Paragraph(`Paid by: ${l.accommodationCoveredBy}`),
        ],
      );

      await addModuleTable(
        "4. Notes & Files",
        "additional",
        (l: AdditionalLog) => [
          new Paragraph({
            children: [new TextRun({ text: l.notes || "-", italics: true })],
          }),
        ],
      );

      const doc = new Document({
        sections: [{ children: children }],
      });

      const blob = await Packer.toBlob(doc);
      const safeTitle = trip.basicInfo.title
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();

      saveAs(blob, `Trip_Report_${safeTitle}.docx`);
    } catch (error) {
      console.error("Docx generation failed", error);
      alert("Failed to generate Word document.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={generateDocx}
      disabled={generating}
      className="flex items-center gap-2"
    >
      {generating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
      {generating ? "Generating..." : "Download as Word"}
    </Button>
  );
}
