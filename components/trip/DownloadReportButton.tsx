"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import {
  DailyLogFormState,
  TravelLog,
  WorkTimeLog,
  AccommodationLog,
  AdditionalLog,
  UploadedFile,
} from "@/app/types/DailyLog";
import { Trip } from "@/app/types/Trip";
import { IEmployeeDetail } from "@/app/types/user";
import { robotoBase64 } from "@/lib/fonts";

interface Props {
  trip: Trip;
  logs: DailyLogFormState[];
}

async function fetchImage(
  url: string,
): Promise<{ base64: string; width: number; height: number } | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          resolve({
            base64: reader.result as string,
            width: img.width,
            height: img.height,
          });
        };
      };
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Image fetch error:", e);
    return null;
  }
}

export default function DownloadReportButton({ trip, logs }: Props) {
  const [generating, setGenerating] = useState(false);

  const getMockEmployeeDetail = (
    userId: string,
    index: number,
  ): IEmployeeDetail & { name: string } => {
    const shortId = userId.slice(-4).toUpperCase();
    return {
      name: `Employee ${shortId}`,
      identityNumber: `${10000000000 + index}`,
      jobTitle: index === 0 ? "Team Lead" : "Developer",
      department: "IT / Engineering",
      homeAddress: {
        street: index === 0 ? "Main St. No:1" : "Broadway Ave. No:10",
        city: "New York",
        zip: "10001",
        country: "USA",
      },
      workAddress: {
        street: "Tech Park Blvd. No:100",
        city: "San Francisco",
        zip: "94016",
        country: "USA",
      },
    };
  };

  const generatePDF = async () => {
    setGenerating(true);
    const doc = new jsPDF();

    if (robotoBase64) {
      doc.addFileToVFS("MyCustomFont.ttf", robotoBase64);
      doc.addFont("MyCustomFont.ttf", "MyCustomFont", "normal");
      doc.setFont("MyCustomFont");
    } else {
      console.warn("Custom font not loaded. Some characters may be broken.");
    }

    const attendants = trip.attendants || [];
    const users = attendants.map((a, index) => ({
      id: a.userId,
      ...getMockEmployeeDetail(a.userId, index),
    }));

    // --- HEADER ---
    doc.setFontSize(18);
    doc.text(`Trip Report: ${trip.basicInfo.title}`, 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(80);

    let headerY = 28;
    const lineHeight = 6;

    const dateRange = `${new Date(trip.basicInfo.startDate).toLocaleDateString()} - ${trip.basicInfo.endDate ? new Date(trip.basicInfo.endDate).toLocaleDateString() : "Ongoing"}`;
    doc.text(`Date Range: ${dateRange}`, 14, headerY);
    headerY += lineHeight;

    if (trip.basicInfo.departureLocation || trip.basicInfo.arrivalLocation) {
      const routeText = `Route: ${trip.basicInfo.departureLocation || "Departure Location"} - ${trip.basicInfo.arrivalLocation || "Arrival Location"}`;
      const splitRoute = doc.splitTextToSize(routeText, 180);
      doc.text(splitRoute, 14, headerY);
      headerY += splitRoute.length * lineHeight;
    }

    const locationDetails = [trip.basicInfo.country, trip.basicInfo.resort]
      .filter(Boolean)
      .join(" / ");
    if (locationDetails) {
      doc.text(`Location/Resort: ${locationDetails}`, 14, headerY);
      headerY += lineHeight;
    }

    if (trip.basicInfo.description) {
      const descLines = doc.splitTextToSize(
        `Description: ${trip.basicInfo.description}`,
        180,
      );
      doc.text(descLines, 14, headerY);
      headerY += descLines.length * lineHeight;
    }

    headerY += 5;

    const infoHeaders = ["Detail", ...users.map((u) => u.name)];
    const infoRows = [
      ["Position", ...users.map((u) => u.jobTitle || "-")],
      ["Department", ...users.map((u) => u.department || "-")],
      ["ID Number", ...users.map((u) => u.identityNumber || "-")],
      [
        "Home Address",
        ...users.map(
          (u) =>
            [u.homeAddress?.street, u.homeAddress?.city]
              .filter(Boolean)
              .join(", ") || "-",
        ),
      ],
      [
        "Work Address",
        ...users.map(
          (u) =>
            [u.workAddress?.street, u.workAddress?.city]
              .filter(Boolean)
              .join(", ") || "-",
        ),
      ],
    ];

    autoTable(doc, {
      startY: headerY,
      head: [infoHeaders],
      body: infoRows,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
        font: robotoBase64 ? "MyCustomFont" : "helvetica",
      },
      headStyles: { fillColor: [50, 50, 50], fontSize: 9 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 30 } },
    });

    // @ts-ignore
    let currentY = doc.lastAutoTable.finalY + 15;

    const drawModuleTable = async (
      typeFilter: string,
      tableTitle: string,
      formatCell: (log: DailyLogFormState) => string,
    ) => {
      const filteredLogs = logs.filter(
        (l) => (l.itemType || "additional").toLowerCase() === typeFilter,
      );

      if (filteredLogs.length === 0) return;

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(tableTitle, 14, currentY);
      currentY += 6;

      const logsByDateUser: Record<
        string,
        Record<string, DailyLogFormState[]>
      > = {};
      const dates = new Set<string>();

      filteredLogs.forEach((log) => {
        const rawDate = log.dateTime || new Date().toISOString();
        const dateKey = rawDate.split("T")[0];
        dates.add(dateKey);
        if (!logsByDateUser[dateKey]) logsByDateUser[dateKey] = {};
        const involvedUsers = new Set([log.userId, ...(log.appliedTo || [])]);
        involvedUsers.forEach((uid) => {
          if (!logsByDateUser[dateKey][uid]) logsByDateUser[dateKey][uid] = [];
          logsByDateUser[dateKey][uid].push(log);
        });
      });

      const sortedDates = Array.from(dates).sort();
      const bodyRows: any[] = [];
      const cellImagesMap: Record<
        string,
        { base64: string; w: number; h: number }[]
      > = {};

      for (let rIndex = 0; rIndex < sortedDates.length; rIndex++) {
        const date = sortedDates[rIndex];
        const dateStr = new Date(date).toLocaleDateString();
        const rowData: any[] = [
          {
            content: dateStr,
            styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
          },
        ];

        for (let uIndex = 0; uIndex < users.length; uIndex++) {
          const user = users[uIndex];
          const userLogs = logsByDateUser[date]?.[user.id];

          if (!userLogs || userLogs.length === 0) {
            rowData.push({
              content: "-",
              styles: { halign: "center", textColor: 150 },
            });
            continue;
          }

          let cellContent = "";
          const cellKey = `${rIndex}-${uIndex + 1}`;
          cellImagesMap[cellKey] = [];

          for (let i = 0; i < userLogs.length; i++) {
            const log = userLogs[i];
            if (i > 0) cellContent += "\n\n-----------------\n\n";
            cellContent += formatCell(log);

            const allFiles: UploadedFile[] = [
              ...(log.files || []),
              ...((log as AdditionalLog).uploadedFiles || []),
            ];

            if (allFiles.length > 0) {
              cellContent += "\n\n--- Attachments ---\n";

              for (const f of allFiles) {
                const isImage =
                  f.type.startsWith("image/") ||
                  f.url.match(/\.(jpeg|jpg|gif|png)$/) != null;

                if (isImage) {
                  const imgData = await fetchImage(f.url);
                  if (imgData) {
                    const targetWidth = 50;
                    const targetHeight =
                      (imgData.height / imgData.width) * targetWidth;
                    cellImagesMap[cellKey].push({
                      base64: imgData.base64,
                      w: targetWidth,
                      h: targetHeight,
                    });
                    const linesNeeded = Math.ceil((targetHeight + 5) / 3.5);
                    cellContent += "\n".repeat(linesNeeded);
                  } else {
                    cellContent += `\n[Image Failed: ${f.name}]`;
                  }
                } else {
                  cellContent += `\n📄 ${f.name}`;
                }
              }
            }
          }
          rowData.push({ content: cellContent });
        }
        bodyRows.push(rowData);
      }

      autoTable(doc, {
        startY: currentY,
        head: [["Date", ...users.map((u) => u.name)]],
        body: bodyRows,
        theme: "grid",
        pageBreak: "auto",
        rowPageBreak: "avoid",
        styles: {
          fontSize: 8,
          cellPadding: 3,
          valign: "top",
          overflow: "linebreak",
          font: robotoBase64 ? "MyCustomFont" : "helvetica",
        },
        columnStyles: { 0: { cellWidth: 25 } },

        didDrawCell: (data) => {
          if (data.section === "body" && data.column.index > 0) {
            const cellKey = `${data.row.index}-${data.column.index}`;
            const images = cellImagesMap[cellKey];

            if (images && images.length > 0) {
              const cellX = data.cell.x + 4;

              let currentImgY = data.cell.y + data.cell.height - 4;
              [...images].reverse().forEach((img) => {
                currentImgY -= img.h;
                doc.addImage(
                  img.base64,
                  "JPEG",
                  cellX,
                  currentImgY,
                  img.w,
                  img.h,
                );
                currentImgY -= 2;
              });
            }
          }
        },
      });

      // @ts-ignore
      currentY = doc.lastAutoTable.finalY + 15;
    };

    // --- MODULES ---
    await drawModuleTable("travel", "1. Travel Records", (log) => {
      const t = log as TravelLog;
      return `Reason: ${t.travelReason || "-"}\nRoute: ${t.departureLocation || "?"} -> ${t.destination || "?"}\nDistance: ${t.distance} km`;
    });

    await drawModuleTable("worktime", "2. Work Time Records", (log) => {
      const w = log as WorkTimeLog;
      return `Time: ${w.startTime} - ${w.endTime}\nDescription:\n${w.description}`;
    });

    await drawModuleTable(
      "accommodation",
      "3. Accommodation & Meals",
      (log) => {
        const a = log as AccommodationLog;
        return `Hotel: ${a.accommodationType || "-"}\nPaid By: ${a.accommodationCoveredBy}\nOvernight: ${a.overnightStay}`;
      },
    );

    await drawModuleTable(
      "additional",
      "4. Additional Notes & Files",
      (log) => {
        const ad = log as AdditionalLog;
        return `Notes: ${ad.notes || "-"}`;
      },
    );

    const safeTitle = trip.basicInfo.title
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();
    doc.save(`Trip_Report_${safeTitle}.pdf`);
    setGenerating(false);
  };

  return (
    <Button
      variant="outline"
      onClick={generatePDF}
      disabled={generating}
      className="flex items-center gap-2"
    >
      {generating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {generating ? "Generating..." : "Download Report"}
    </Button>
  );
}
