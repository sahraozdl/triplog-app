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
} from "@/app/types/DailyLog";
import { Trip } from "@/app/types/Trip";
import { IEmployeeDetail } from "@/app/types/user";

interface Props {
  trip: Trip;
  logs: DailyLogFormState[];
}

export default function DownloadReportButton({ trip, logs }: Props) {
  const [generating, setGenerating] = useState(false);

  // --- MOCK DATA GENERATOR ---
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

  const generatePDF = () => {
    setGenerating(true);
    const doc = new jsPDF();

    // 1. Determine the attendants
    const attendants = trip.attendants || [];
    const users = attendants.map((a, index) => ({
      id: a.userId,
      ...getMockEmployeeDetail(a.userId, index),
    }));

    // --- REPORT HEADER ---
    doc.setFontSize(18);
    doc.text(`Trip Report: ${trip.basicInfo.title}`, 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(80);

    let headerY = 28;
    const lineHeight = 5;

    // Date Range
    const dateRange = `${new Date(trip.basicInfo.startDate).toLocaleDateString()} - ${trip.basicInfo.endDate ? new Date(trip.basicInfo.endDate).toLocaleDateString() : "Ongoing"}`;
    doc.text(`Date Range: ${dateRange}`, 14, headerY);
    headerY += lineHeight;

    // Route / Location
    if (trip.basicInfo.departureLocation || trip.basicInfo.arrivalLocation) {
      const route = `${trip.basicInfo.departureLocation || "Origin"} -> ${trip.basicInfo.arrivalLocation || "Destination"}`;
      doc.text(`Route: ${route}`, 14, headerY);
      headerY += lineHeight;
    }

    // Country & Resort
    const locationDetails = [trip.basicInfo.country, trip.basicInfo.resort]
      .filter(Boolean)
      .join(" / ");
    if (locationDetails) {
      doc.text(`Destination: ${locationDetails}`, 14, headerY);
      headerY += lineHeight;
    }

    // Description
    if (trip.basicInfo.description) {
      const descLines = doc.splitTextToSize(
        `Description: ${trip.basicInfo.description}`,
        180,
      );
      doc.text(descLines, 14, headerY);
      headerY += descLines.length * lineHeight;
    }

    headerY += 5;

    // --- TABLE 1: EMPLOYEE (Info) ---
    const infoHeaders = ["Detail", ...users.map((u) => u.name)];
    const infoRows = [
      ["Position", ...users.map((u) => u.jobTitle || "-")],
      ["Department", ...users.map((u) => u.department || "-")],
      ["ID Number", ...users.map((u) => u.identityNumber || "-")],
      [
        "Home Address",
        ...users.map((u) => `${u.homeAddress?.city}, ${u.homeAddress?.street}`),
      ],
      [
        "Work Address",
        ...users.map((u) => `${u.workAddress?.city}, ${u.workAddress?.street}`),
      ],
    ];

    autoTable(doc, {
      startY: headerY,
      head: [infoHeaders],
      body: infoRows,
      theme: "grid",
      headStyles: { fillColor: [50, 50, 50], fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 25 } },
    });

    // @ts-ignore
    let currentY = doc.lastAutoTable.finalY + 15;

    const drawModuleTable = (
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

      const rows: any[] = [];
      const sortedDates = Array.from(dates).sort();

      sortedDates.forEach((date) => {
        const dateStr = new Date(date).toLocaleDateString();

        const rowData: any[] = [
          {
            content: dateStr,
            styles: {
              fillColor: [240, 240, 240],
              fontStyle: "bold",
              textColor: 50,
            },
          },
        ];

        users.forEach((user) => {
          const userLogs = logsByDateUser[date]?.[user.id];

          if (!userLogs || userLogs.length === 0) {
            rowData.push({
              content: "-",
              styles: { halign: "center", textColor: 150 },
            });
            return;
          }

          const hasSharedLog = userLogs.some(
            (l) => l.isGroupSource || (l.appliedTo && l.appliedTo.length > 0),
          );

          const cellText = userLogs
            .map((log) => {
              let content = formatCell(log);

              // List Files (Clickable Link Format Text)
              if (log.files && log.files.length > 0) {
                content += "\n\n--- Attachments ---";
                log.files.forEach((f) => {
                  // if it doesn't fit, we can simply say "Link" or the file name.
                  // PDF clickable link is needed, but it's difficult in autotable.
                  // The best way is to write the URL explicitly.
                  content += `\n📄 ${f.name} (${f.url})`;
                });
              }
              return content;
            })
            .join("\n\n-----------------\n\n");

          // If there is shared data, make the background slightly blue
          const cellStyles = hasSharedLog ? { fillColor: [240, 248, 255] } : {};

          rowData.push({
            content: cellText,
            styles: cellStyles,
          });
        });
        rows.push(rowData);
      });

      autoTable(doc, {
        startY: currentY,
        head: [["Date", ...users.map((u) => u.name)]],
        body: rows,
        theme: "grid",
        headStyles: { fillColor: [41, 128, 185], fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 3, valign: "top" },
        columnStyles: { 0: { cellWidth: 25 } },
        didDrawPage: (data) => {
          // @ts-ignore
          currentY = data.cursor.y;
        },
      });

      // @ts-ignore
      currentY = doc.lastAutoTable.finalY + 15;
    };

    // --- MODULE 1: TRAVEL RECORDS ---
    drawModuleTable("travel", "1. Travel Records", (log) => {
      const t = log as TravelLog;

      // Açık ve net etiketler
      let text = "";
      text += `Travel Reason: ${t.travelReason || "N/A"}\n`;
      text += `Vehicle Type: ${t.vehicleType || "N/A"}\n`;
      text += `Route: ${t.departureLocation || "?"} > ${t.destination || "?"}\n`;
      text += `Distance: ${t.distance ? t.distance + " km" : "N/A"}\n`;
      text += `Start Time: ${t.startTime || "?"} - End Time: ${t.endTime || "?"}\n`;
      text += `Round Trip: ${t.isRoundTrip ? "Yes" : "No"}`;

      return text;
    });

    // --- MODULE 2: WORK TIME RECORDS ---
    drawModuleTable("worktime", "2. Work Time Records", (log) => {
      const w = log as WorkTimeLog;
      return (
        `Work Start Time: ${w.startTime}\n` +
        `Work End Time: ${w.endTime}\n` +
        `Description: ${w.description}`
      );
    });

    // --- MODULE 3: ACCOMMODATION RECORDS ---
    drawModuleTable("accommodation", "3. Accommodation & Meals", (log) => {
      const a = log as AccommodationLog;
      let text = `Accommodation Type: ${a.accommodationType}\n`;
      text += `Covered By: ${a.accommodationCoveredBy || "-"}\n`;
      text += `Overnight Stay: ${a.overnightStay === "yes" ? "Yes" : "No"}\n`;

      const meals = [];
      if (a.meals.breakfast.eaten)
        meals.push(`Breakfast (covered by: ${a.meals.breakfast.coveredBy})`);
      if (a.meals.lunch.eaten)
        meals.push(`Lunch (covered by: ${a.meals.lunch.coveredBy})`);
      if (a.meals.dinner.eaten)
        meals.push(`Dinner (covered by: ${a.meals.dinner.coveredBy})`);

      if (meals.length > 0) text += `\nMeals:\n ${meals.join(", ")}`;
      return text;
    });

    // --- MODULE 4: ADDITIONAL RECORDS ---
    drawModuleTable("additional", "4. Additional Notes & Files", (log) => {
      const ad = log as AdditionalLog;
      return `Notes: ${ad.notes}`;
    });

    // --- SAVE PDF ---
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
