const createCsvWriter = require("csv-writer").createObjectCsvWriter
const ExcelJS = require("exceljs")
const path = require("path")
const fs = require("fs").promises

// Generate CSV report
const generateCSVReport = async (data) => {
  if (!data || data.length === 0) {
    return "No data available"
  }

  try {
    // Get headers from first object
    const headers = Object.keys(data[0]).map((key) => ({
      id: key,
      title: key.replace(/_/g, " ").toUpperCase(),
    }))

    // Create temporary file path
    const tempPath = path.join(__dirname, "../temp", `report_${Date.now()}.csv`)

    // Ensure temp directory exists
    await fs.mkdir(path.dirname(tempPath), { recursive: true })

    const csvWriter = createCsvWriter({
      path: tempPath,
      header: headers,
    })

    await csvWriter.writeRecords(data)

    // Read the file and return content
    const csvContent = await fs.readFile(tempPath, "utf8")

    // Clean up temp file
    await fs.unlink(tempPath).catch(() => {}) // Ignore errors

    return csvContent
  } catch (error) {
    console.error("Error generating CSV report:", error)
    throw new Error("Failed to generate CSV report")
  }
}

const generateExcelReport = async (data, sheetName = "Report") => {
  try {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(sheetName)

    if (!data || data.length === 0) {
      worksheet.addRow(["No data available"])
      return await workbook.xlsx.writeBuffer()
    }

    // Add headers
    const headers = Object.keys(data[0])
    const headerRow = worksheet.addRow(headers.map((h) => h.replace(/_/g, " ").toUpperCase()))

    // Style headers
    headerRow.eachCell((cell) => {
      cell.font = { bold: true }
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      }
    })

    // Add data rows
    data.forEach((row) => {
      const values = headers.map((header) => row[header])
      worksheet.addRow(values)
    })

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      let maxLength = 0
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10
        if (columnLength > maxLength) {
          maxLength = columnLength
        }
      })
      column.width = maxLength < 10 ? 10 : maxLength + 2
    })

    return await workbook.xlsx.writeBuffer()
  } catch (error) {
    console.error("Error generating Excel report:", error)
    throw new Error("Failed to generate Excel report")
  }
}

module.exports = {
  generateCSVReport,
  generateExcelReport,
}
