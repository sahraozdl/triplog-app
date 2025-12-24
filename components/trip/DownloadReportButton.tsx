"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import {
  DailyLogFormState,
  WorkTimeLog,
  AccommodationLog,
  AdditionalLog,
  UploadedFile,
} from "@/app/types/DailyLog";
import { Travel } from "@/app/types/Travel";
import { Trip } from "@/app/types/Trip";
import { PDFTableRow } from "@/app/types/PDFTable";
import { robotoBase64 } from "@/lib/fonts";
import { formatMeals } from "@/lib/utils/dailyLogHelpers";
import { fetchImage, fetchAttendantDetails } from "@/lib/utils/pdfHelpers";
import { useAppUser } from "@/components/providers/AppUserProvider";

interface Props {
  trip: Trip;
  logs: DailyLogFormState[];
  travels?: Travel[];
}

export function DownloadReportButton({ trip, logs, travels = [] }: Props) {
  const [generating, setGenerating] = useState(false);
  const user = useAppUser();

  const generatePDF = async () => {
    setGenerating(true);
    const doc = new jsPDF();

    if (robotoBase64) {
      doc.addFileToVFS("MyCustomFont.ttf", robotoBase64);
      doc.addFont("MyCustomFont.ttf", "MyCustomFont", "normal");
      doc.setFont("MyCustomFont");
    }

    const attendantIds = trip.attendants?.map((a) => a.userId) || [];
    const allLogUserIds = new Set<string>();
    logs.forEach((log) => {
      allLogUserIds.add(log.userId);
      log.appliedTo?.forEach((id) => allLogUserIds.add(id));
    });
    travels.forEach((travel) => {
      allLogUserIds.add(travel.userId);
      travel.appliedTo?.forEach((id) => allLogUserIds.add(id));
    });
    const userDetailsMap = await fetchAttendantDetails(
      Array.from(allLogUserIds),
    );

    const users = attendantIds.map((id) => {
      const user = userDetailsMap[id];
      const details = user?.employeeDetail || {};
      return {
        id: id,
        name: user?.name || "Unknown User",
        jobTitle: details.jobTitle || "-",
        department: details.department || "-",
        identityNumber: details.identityNumber || "-",
        homeAddress: details.homeAddress,
        workAddress: details.workAddress,
      };
    });

    doc.setFontSize(18);
    doc.text(`Trip Report: ${trip.basicInfo.title}`, 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    let headerY = 28;
    const lineHeight = 6;

    const dateRange = `${new Date(trip.basicInfo.startDate).toLocaleDateString()} - ${trip.basicInfo.endDate ? new Date(trip.basicInfo.endDate).toLocaleDateString() : "Ongoing"}`;
    doc.text(`Date: ${dateRange}`, 14, headerY);
    headerY += lineHeight;

    if (trip.basicInfo.departureLocation || trip.basicInfo.arrivalLocation) {
      const routeText = `Route: ${trip.basicInfo.departureLocation || "Origin"} -> ${trip.basicInfo.arrivalLocation || "Destination"}`;
      const splitRoute = doc.splitTextToSize(routeText, 180);
      doc.text(splitRoute, 14, headerY);
      headerY += splitRoute.length * lineHeight;
    }

    const locationDetails = [trip.basicInfo.country, trip.basicInfo.resort]
      .filter(Boolean)
      .join(" / ");
    const destinationText =
      locationDetails || trip.basicInfo.arrivalLocation || "Not specified";
    doc.text(`Destination: ${destinationText}`, 14, headerY);
    headerY += lineHeight;

    if (trip.basicInfo.description) {
      const descLines = doc.splitTextToSize(
        `Description: ${trip.basicInfo.description}`,
        180,
      );
      doc.text(descLines, 14, headerY);
      headerY += descLines.length * lineHeight;
    }

    headerY += 5;

    const accommodationLogs = logs.filter(
      (l) => l.itemType === "accommodation",
    ) as AccommodationLog[];
    const totalNights = accommodationLogs.filter(
      (a) => a.overnightStay === "yes",
    ).length;
    const totalNightsCoveredByEmployee = accommodationLogs.filter(
      (a) =>
        a.overnightStay === "yes" && a.accommodationCoveredBy === "private",
    ).length;

    // Use Travel entries instead of travel logs from DailyLog
    const totalKm = travels.reduce((sum, t) => {
      const distance = typeof t.distance === "number" ? t.distance : 0;
      return sum + distance;
    }, 0);

    const attendantsList = trip.attendants || [];
    const isUserInAttendantsList = attendantsList.some(
      (attendant) => attendant.userId === user?.userId,
    );
    const totalAttendants = isUserInAttendantsList
      ? attendantsList.length
      : attendantsList.length + 1;

    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(`Total Nights: ${totalNights}`, 14, headerY);
    headerY += lineHeight;
    doc.text(
      `Total Nights Covered by Employee: ${totalNightsCoveredByEmployee}`,
      14,
      headerY,
    );
    headerY += lineHeight;
    doc.text(`Total km: ${totalKm.toFixed(2)}`, 14, headerY);
    headerY += lineHeight;
    doc.text(`Total attendants: ${totalAttendants}`, 14, headerY);
    headerY += lineHeight + 5;

    const infoHeaders = ["Detail", ...users.map((u) => u.name)];
    const infoRows = [
      ["Position", ...users.map((u) => u.jobTitle)],
      ["Department", ...users.map((u) => u.department)],
      ["ID Number", ...users.map((u) => u.identityNumber)],
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

    // Helper function to calculate column widths with fixed date column
    const calculateColumnWidths = (
      columnCount: number,
      pageWidth: number = 210,
      margins: number = 28,
      dateColumnWidth: number = 25,
    ) => {
      const availableWidth = pageWidth - margins;
      const remainingWidth = availableWidth - dateColumnWidth;
      const otherColumnsCount = columnCount - 1;
      const equalWidth =
        otherColumnsCount > 0
          ? remainingWidth / otherColumnsCount
          : remainingWidth;

      const columnStyles: Record<number, { cellWidth: number }> = {};
      columnStyles[0] = { cellWidth: dateColumnWidth }; // Fixed date column
      for (let i = 1; i < columnCount; i++) {
        columnStyles[i] = { cellWidth: equalWidth };
      }
      return columnStyles;
    };

    // Helper function to calculate equal column widths (for tables without date column)
    const calculateEqualColumnWidths = (
      columnCount: number,
      pageWidth: number = 210,
      margins: number = 28,
    ) => {
      const availableWidth = pageWidth - margins;
      const equalWidth = availableWidth / columnCount;
      const columnStyles: Record<number, { cellWidth: number }> = {};
      for (let i = 0; i < columnCount; i++) {
        columnStyles[i] = { cellWidth: equalWidth };
      }
      return columnStyles;
    };

    // Calculate equal column widths for info table
    const infoColumnCount = infoHeaders.length;
    const equalInfoColumnStyles = calculateEqualColumnWidths(infoColumnCount);
    // Override first column to be slightly narrower for "Detail" label
    equalInfoColumnStyles[0] = { cellWidth: 30 };

    autoTable(doc, {
      startY: headerY,
      head: [infoHeaders],
      body: infoRows,
      theme: "grid",
      showHead: "firstPage", // Only show header on first page to avoid orphaned headers
      styles: {
        fontSize: 8,
        cellPadding: 2,
        font: robotoBase64 ? "MyCustomFont" : "helvetica",
      },
      headStyles: {
        fillColor: [40, 40, 40],
        fontSize: 9,
        textColor: 255,
        fontStyle: "normal",
        font: robotoBase64 ? "MyCustomFont" : "helvetica",
      },
      columnStyles: equalInfoColumnStyles,
    });

    let currentY = (doc as any).lastAutoTable.finalY + 15;

    // Helper function to ensure table starts on new page with enough space
    const ensureTableSpace = (
      headerHeight: number = 10,
      minRowHeight: number = 20,
    ) => {
      const pageHeight = doc.internal.pageSize.height;
      const bottomMargin = 20;
      const availableSpace = pageHeight - currentY - bottomMargin;
      const requiredSpace = headerHeight + minRowHeight;

      if (availableSpace < requiredSpace) {
        doc.addPage();
        currentY = 20;
      }
    };

    const drawModuleTable = async (
      typeFilter: string,
      tableTitle: string,
      formatCell: (log: DailyLogFormState) => string,
    ) => {
      const filteredLogs = logs.filter(
        (l) => (l.itemType || "additional").toLowerCase() === typeFilter,
      );

      if (filteredLogs.length === 0) return;

      // Ensure table starts on new page with enough space
      ensureTableSpace(10, 20);

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
        // Each log belongs to one user (log.userId) since colleagues now have their own real logs
        const userId = log.userId;
        if (userId) {
          if (!logsByDateUser[dateKey][userId])
            logsByDateUser[dateKey][userId] = [];
          logsByDateUser[dateKey][userId].push(log);
        }
      });

      const sortedDates = Array.from(dates).sort();
      const bodyRows: PDFTableRow[] = [];
      const cellImagesMap: Record<
        string,
        { base64: string; w: number; h: number }[]
      > = {};

      // Calculate column count for image scaling
      const columnCount = users.length + 1; // Date column + user columns

      for (let rIndex = 0; rIndex < sortedDates.length; rIndex++) {
        const date = sortedDates[rIndex];
        const dateStr = new Date(date).toLocaleDateString();
        const rowData: PDFTableRow = [
          {
            content: dateStr,
            styles: {
              fontStyle: "normal",
              fillColor: [240, 240, 240],
              font: robotoBase64 ? "MyCustomFont" : "helvetica",
            },
          },
        ];

        for (let uIndex = 0; uIndex < users.length; uIndex++) {
          const user = users[uIndex];
          // Get user's logs directly from database (each user has their own real logs)
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
                    // Calculate max width based on column width (accounting for padding)
                    const pageWidth = doc.internal.pageSize.width;
                    const margins = 28;
                    const availableWidth = pageWidth - margins;
                    const dateColumnWidth = 25;
                    const remainingWidth = availableWidth - dateColumnWidth;
                    const otherColumnsCount = columnCount - 1;
                    const columnWidth =
                      otherColumnsCount > 0
                        ? remainingWidth / otherColumnsCount
                        : remainingWidth;
                    const maxImageWidth = columnWidth - 8; // Account for cell padding
                    const targetWidth = Math.min(50, maxImageWidth); // Cap at 50px but scale down if needed
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

      const equalColumnStyles = calculateColumnWidths(columnCount);

      autoTable(doc, {
        startY: currentY,
        head: [["Date", ...users.map((u) => u.name)]],
        body: bodyRows as any,
        theme: "grid",
        pageBreak: "auto",
        rowPageBreak: "avoid",
        showHead: "firstPage", // Only show header on first page to avoid orphaned headers
        styles: {
          fontSize: 8,
          cellPadding: 3,
          valign: "top",
          overflow: "linebreak",
          font: robotoBase64 ? "MyCustomFont" : "helvetica",
        },
        columnStyles: equalColumnStyles,
        headStyles: {
          fillColor: [70, 58, 128],
          fontSize: 9,
          textColor: 255,
          fontStyle: "normal",
          font: robotoBase64 ? "MyCustomFont" : "helvetica",
        },
        didDrawCell: (data) => {
          if (data.section === "body" && data.column.index > 0) {
            const cellKey = `${data.row.index}-${data.column.index}`;
            const images = cellImagesMap[cellKey];
            if (images && images.length > 0) {
              const cellX = data.cell.x + 4;
              let currentImgY = data.cell.y + data.cell.height - 4;
              const maxCellWidth = data.cell.width - 8; // Account for padding

              [...images].reverse().forEach((img) => {
                // Ensure image fits within cell width
                let finalWidth = img.w;
                let finalHeight = img.h;

                if (finalWidth > maxCellWidth) {
                  finalWidth = maxCellWidth;
                  finalHeight = (img.h / img.w) * finalWidth;
                }

                currentImgY -= finalHeight;
                doc.addImage(
                  img.base64,
                  "JPEG",
                  cellX,
                  currentImgY,
                  finalWidth,
                  finalHeight,
                );
                currentImgY -= 2;
              });
            }
          }
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    };

    // Draw Travel entries separately (not from DailyLog) - Grouped by date
    if (travels.length > 0) {
      // Ensure table starts on new page with enough space
      ensureTableSpace(10, 20);

      doc.setFontSize(14);
      doc.text("1. Travel Records", 14, currentY);
      currentY += 10;

      const travelDates = Array.from(
        new Set(travels.map((t) => t.dateTime.split("T")[0])),
      ).sort();

      const travelRows: PDFTableRow[] = [];
      const travelImagesMap: Record<
        string,
        { base64: string; w: number; h: number }[]
      > = {};

      // Check if we need creator column (multiple userIds on any date)
      let needsUserSeparation = false;
      for (const date of travelDates) {
        const dateTravels = travels.filter(
          (t) => t.dateTime.split("T")[0] === date,
        );
        const uniqueUserIds = new Set(dateTravels.map((t) => t.userId));
        if (uniqueUserIds.size > 1) {
          needsUserSeparation = true;
          break;
        }
      }

      for (let rIndex = 0; rIndex < travelDates.length; rIndex++) {
        const date = travelDates[rIndex];
        const dateTravels = travels.filter(
          (t) => t.dateTime.split("T")[0] === date,
        );

        // Process each travel entry for this date
        for (let tIndex = 0; tIndex < dateTravels.length; tIndex++) {
          const travel = dateTravels[tIndex];
          const rowData: PDFTableRow = [];

          // Date column (only for first travel on this date)
          if (tIndex === 0) {
            rowData.push({
              content: new Date(date).toLocaleDateString(),
              styles: {
                fontStyle: "normal",
                fillColor: [240, 240, 240],
                font: robotoBase64 ? "MyCustomFont" : "helvetica",
              },
            });
          } else {
            rowData.push({ content: "" });
          }

          // Travel Details column
          let travelDetails = `Reason: ${travel.travelReason || "-"}\n`;
          travelDetails += `Route: ${travel.departureLocation || "?"} -> ${travel.destination || "?"}\n`;
          if (travel.distance) {
            travelDetails += `Distance: ${travel.distance} km`;
            if (travel.isRoundTrip) travelDetails += " (Round Trip)";
            travelDetails += "\n";
          }
          if (travel.startTime || travel.endTime) {
            travelDetails += `Time: ${travel.startTime || ""}${travel.startTime && travel.endTime ? " - " : ""}${travel.endTime || ""}\n`;
          }
          if (travel.vehicleType) {
            travelDetails += `Vehicle: ${travel.vehicleType.replace("-", " ")}\n`;
          }

          // Add attendants (including creator)
          const allAttendants = [travel.userId, ...(travel.appliedTo || [])];
          const uniqueAttendants = Array.from(new Set(allAttendants));
          if (uniqueAttendants.length > 0) {
            const attendantNames = uniqueAttendants.map(
              (id) => userDetailsMap[id]?.name || "Unknown User",
            );
            travelDetails += `Attendants: ${attendantNames.join(", ")}\n`;
          }

          rowData.push({ content: travelDetails });

          // Creator column (only if multiple users on same date)
          if (needsUserSeparation) {
            const creatorName =
              userDetailsMap[travel.userId]?.name || "Unknown User";
            rowData.push({ content: creatorName });
          }

          // Use row index for image mapping
          const rowIndex = travelRows.length;
          const imageCellKey = `${rowIndex}-images`;
          travelImagesMap[imageCellKey] = [];

          // Handle images - prepare for separate column
          let imageText = "";
          if (travel.files && travel.files.length > 0) {
            // Calculate max image width based on column width
            const pageWidth = doc.internal.pageSize.width;
            const margins = 28;
            const availableWidth = pageWidth - margins;
            const dateColumnWidth = 25;
            const remainingWidth = availableWidth - dateColumnWidth;
            const imageColumnCount = needsUserSeparation ? 4 : 3; // Date, Details, Creator (optional), Images
            const otherColumnsCount = imageColumnCount - 1;
            const imageColumnWidth =
              otherColumnsCount > 0
                ? remainingWidth / otherColumnsCount
                : remainingWidth;
            const maxImageWidth = imageColumnWidth - 8; // Account for cell padding

            for (const file of travel.files) {
              const isImage =
                file.type.startsWith("image/") ||
                file.url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
              if (isImage) {
                const imgData = await fetchImage(file.url);
                if (imgData) {
                  // Scale image to fit column width, but cap at reasonable size
                  const targetWidth = Math.min(80, maxImageWidth);
                  const targetHeight =
                    (imgData.height / imgData.width) * targetWidth;
                  travelImagesMap[imageCellKey].push({
                    base64: imgData.base64,
                    w: targetWidth,
                    h: targetHeight,
                  });
                  const linesNeeded = Math.ceil((targetHeight + 5) / 3.5);
                  imageText += "\n".repeat(linesNeeded);
                } else {
                  imageText += `\n[Image: ${file.name}]\n`;
                }
              } else {
                imageText += `\n📄 ${file.name}\n`;
              }
            }
          } else {
            imageText = "-";
          }

          // Add Images column
          rowData.push({ content: imageText });

          travelRows.push(rowData);
        }
      }

      const headers = needsUserSeparation
        ? ["Date", "Creator", "Travel Details", "Routes"]
        : ["Date", "Travel Details", "Routes"];

      // Determine image column index
      const imageColumnIndex = needsUserSeparation ? 3 : 2;

      // Calculate column widths with fixed date column
      const travelColumnCount = headers.length;
      const equalTravelColumnStyles = calculateColumnWidths(travelColumnCount);

      autoTable(doc, {
        startY: currentY,
        head: [headers],
        body: travelRows as any,
        theme: "grid",
        pageBreak: "auto",
        rowPageBreak: "avoid",
        showHead: "firstPage", // Only show header on first page to avoid orphaned headers
        styles: {
          fontSize: 8,
          cellPadding: 3,
          valign: "top",
          overflow: "linebreak",
          font: robotoBase64 ? "MyCustomFont" : "helvetica",
        },
        columnStyles: equalTravelColumnStyles,
        headStyles: {
          fillColor: [70, 58, 128],
          fontSize: 9,
          textColor: 255,
          fontStyle: "normal",
          font: robotoBase64 ? "MyCustomFont" : "helvetica",
        },
        didDrawCell: (data) => {
          if (
            data.section === "body" &&
            data.column.index === imageColumnIndex
          ) {
            const cellKey = `${data.row.index}-images`;
            const images = travelImagesMap[cellKey];
            if (images && images.length > 0) {
              const cellX = data.cell.x + 2;
              let currentImgY = data.cell.y + 4;
              const maxCellWidth = data.cell.width - 4; // Account for padding

              images.forEach((img) => {
                // Ensure image fits within cell width
                let finalWidth = img.w;
                let finalHeight = img.h;

                if (finalWidth > maxCellWidth) {
                  finalWidth = maxCellWidth;
                  finalHeight = (img.h / img.w) * finalWidth;
                }

                // Ensure image doesn't overflow cell height
                const remainingCellHeight =
                  data.cell.height - (currentImgY - data.cell.y) - 4;
                if (finalHeight > remainingCellHeight) {
                  finalHeight = remainingCellHeight;
                  finalWidth = (img.w / img.h) * finalHeight;
                }

                doc.addImage(
                  img.base64,
                  "JPEG",
                  cellX,
                  currentImgY,
                  finalWidth,
                  finalHeight,
                );
                currentImgY += finalHeight + 3; // Add spacing between images
              });
            }
          }
        },
      });

      currentY =
        (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
          .finalY + 15;
    }

    await drawModuleTable("worktime", "2. Work Time Records", (log) => {
      const w = log as WorkTimeLog;
      return `Time: ${w.startTime} - ${w.endTime}\nDescription:\n${w.description}`;
    });

    await drawModuleTable(
      "accommodation",
      "3. Accommodation & Meals",
      (log) => {
        const a = log as AccommodationLog;
        let content = `Accommodation: ${a.accommodationType || "-"}\nPaid By: ${a.accommodationCoveredBy || "-"}\nOvernight: ${a.overnightStay || "-"}`;
        const mealsText = formatMeals(a);
        if (mealsText) {
          content += `\n\nMeals:\n${mealsText}`;
        }
        return content;
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

    if (
      trip.additionalFiles &&
      Array.isArray(trip.additionalFiles) &&
      trip.additionalFiles.length > 0
    ) {
      const additionalFiles = trip.additionalFiles.filter(
        (f): f is NonNullable<typeof f> =>
          f !== null &&
          f !== undefined &&
          typeof f === "object" &&
          "url" in f &&
          typeof f.url === "string",
      );

      if (additionalFiles.length > 0) {
        // Ensure table starts on new page with enough space
        ensureTableSpace(10, 20);

        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("5. Additional Files", 14, currentY);
        currentY += 6;

        const imageDataMap: Record<
          number,
          { base64: string; w: number; h: number }
        > = {};

        for (let i = 0; i < additionalFiles.length; i++) {
          const file = additionalFiles[i];
          if (!file || !file.url) continue;

          const isImage =
            file.type?.startsWith("image/") ||
            file.url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) != null;

          if (isImage) {
            const imgData = await fetchImage(file.url);
            if (imgData) {
              const targetWidth = 50;
              const targetHeight =
                (imgData.height / imgData.width) * targetWidth;
              imageDataMap[i] = {
                base64: imgData.base64,
                w: targetWidth,
                h: targetHeight,
              };
            }
          }
        }

        const cellPadding = 3;
        const imagesPerRow = 2;
        const pageWidth = doc.internal.pageSize.getWidth();
        const margins = 14 * 2;
        const borderWidth = 4;
        const totalPadding = cellPadding * 4;
        const buffer = 2;
        const availableWidth =
          pageWidth - margins - totalPadding - borderWidth - buffer;
        const cellWidth = Math.max(Math.floor(availableWidth / 2), 50);
        const minCellHeight = 60;

        const tableRows: PDFTableRow[] = [];
        for (let i = 0; i < additionalFiles.length; i += imagesPerRow) {
          const row: PDFTableRow = [];
          let maxHeightInRow = minCellHeight;

          for (let j = 0; j < imagesPerRow; j++) {
            const fileIndex = i + j;
            if (fileIndex < additionalFiles.length) {
              const imgData = imageDataMap[fileIndex];
              if (imgData) {
                const neededHeight = imgData.h + cellPadding * 2 + 8;
                if (neededHeight > maxHeightInRow) {
                  maxHeightInRow = neededHeight;
                }
              }
            }
          }

          for (let j = 0; j < imagesPerRow; j++) {
            const fileIndex = i + j;
            if (fileIndex < additionalFiles.length) {
              const imgData = imageDataMap[fileIndex];
              const linesNeeded = imgData
                ? Math.ceil(maxHeightInRow / 3.5)
                : Math.ceil(minCellHeight / 3.5);
              row.push({
                content: "\n".repeat(Math.max(linesNeeded, 5)),
              });
            } else {
              row.push({
                content: "\n".repeat(Math.ceil(minCellHeight / 3.5)),
              });
            }
          }
          tableRows.push(row);
        }

        autoTable(doc, {
          startY: currentY,
          head: [["", ""]],
          body: tableRows as any,
          theme: "grid",
          pageBreak: "auto",
          rowPageBreak: "avoid",
          margin: { left: 14, right: 14 },
          styles: {
            fontSize: 8,
            cellPadding: cellPadding,
            valign: "top",
            overflow: "linebreak",
            font: robotoBase64 ? "MyCustomFont" : "helvetica",
          },
          columnStyles: {
            0: { cellWidth: cellWidth },
            1: { cellWidth: cellWidth },
          },
          headStyles: {
            fillColor: [70, 58, 128],
            fontSize: 9,
            textColor: 255,
            fontStyle: "normal",
            font: robotoBase64 ? "MyCustomFont" : "helvetica",
          },
          didDrawCell: (data) => {
            if (
              data.section === "body" &&
              data.column.index >= 0 &&
              data.cell
            ) {
              const fileIndex =
                data.row.index * imagesPerRow + data.column.index;

              if (fileIndex < additionalFiles.length) {
                const file = additionalFiles[fileIndex];
                const imgData = imageDataMap[fileIndex];

                if (file && imgData) {
                  const cellX = data.cell.x + 4;
                  const cellY = data.cell.y + data.cell.height - 4;
                  const imgY = cellY - imgData.h;

                  if (
                    cellX + imgData.w <=
                      data.cell.x + data.cell.width - cellPadding &&
                    imgY >= data.cell.y + cellPadding &&
                    imgY + imgData.h <=
                      data.cell.y + data.cell.height - cellPadding
                  ) {
                    try {
                      let format: "JPEG" | "PNG" = "JPEG";
                      if (
                        imgData.base64.startsWith("data:image/png") ||
                        file.url.match(/\.png$/i)
                      ) {
                        format = "PNG";
                      }

                      doc.addImage(
                        imgData.base64,
                        format,
                        cellX,
                        imgY,
                        imgData.w,
                        imgData.h,
                      );
                    } catch (error) {
                      console.error(
                        `Failed to add image for file ${file.name}:`,
                        error,
                      );
                    }
                  }
                }
              }
            }
          },
        });

        currentY = (doc as any).lastAutoTable.finalY + 15;
      }
    }

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
      {generating ? "Generating..." : "Download Report (PDF)"}
    </Button>
  );
}
