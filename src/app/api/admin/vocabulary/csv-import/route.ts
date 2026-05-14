import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'
import { withAdminAuth } from '@/lib/middleware'

export async function POST(request: NextRequest) {
  const authResult = await withAdminAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult // Error response
  }
  
  const createdBy = authResult.user.userId
  
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }
    
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: "Only CSV files are allowed" }, { status: 400 })
    }
    
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV file must have at least a header and one data row" }, { status: 400 })
    }
    
    // Parse CSV (simple comma-separated parser)
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const requiredHeaders = ['english', 'thai']
    
    for (const header of requiredHeaders) {
      if (!headers.includes(header)) {
        return NextResponse.json({ error: `Missing required header: ${header}` }, { status: 400 })
      }
    }
    
    let successCount = 0
    let errorCount = 0
    const errors: string[] = []
    
    console.log(`📥 CSV Import Started - Processing ${lines.length - 1} rows`)
    console.log(`📋 Headers: ${headers.join(', ')}`)
    
    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim())
        const rowData: any = {}
        
        headers.forEach((header, index) => {
          rowData[header] = values[index] || ''
        })
        
        if (!rowData.english || !rowData.thai) {
          errors.push(`Row ${i + 1}: english and thai are required`)
          errorCount++
          continue
        }
        
        const result = await pool.query(
          'INSERT INTO admin_custom_vocabulary (english, thai, phonetic, example, category, difficulty, created_by) ' +
          'VALUES ($1, $2, $3, $4, $5, $6, $7) ' +
          'ON CONFLICT (english) DO UPDATE SET ' +
          'thai = $2, phonetic = $3, example = $4, category = $5, difficulty = $6, updated_at = NOW() ' +
          'RETURNING *',
          [
            rowData.english,
            rowData.thai,
            rowData.phonetic || null,
            rowData.example || null,
            rowData.category || 'general',
            parseInt(rowData.difficulty) || 2,
            createdBy
          ]
        )
        
        successCount++
        
        // Log progress every 100 words
        if (successCount % 100 === 0) {
          console.log(`✅ Progress: ${successCount} words imported successfully`)
        }
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        errorCount++
      }
    }
    
    console.log(`📊 CSV Import Summary:`)
    console.log(`   - Total rows processed: ${lines.length - 1}`)
    console.log(`   - Successfully imported: ${successCount} words`)
    console.log(`   - Failed to import: ${errorCount} words`)
    if (errors.length > 0) {
      console.log(`   - First few errors: ${errors.slice(0, 3).join(' | ')}`)
    }
    
    // Create a streaming response for real-time progress
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('📥 API: CSV import started - Received file request');
          console.log(`📋 API: Total rows to process: ${lines.length - 1}`);
          console.log(`📋 API: Headers detected: ${headers.join(', ')}`);
          
          // Send initial progress
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'start',
            total: lines.length - 1,
            message: `เริ่มนำเข้า ${lines.length - 1} คำ...`
          })}\n\n`))

          let successCount = 0
          let errorCount = 0
          const errors: string[] = []
          
          // Process each data row
          for (let i = 1; i < lines.length; i++) {
            try {
              const values = lines[i].split(',').map(v => v.trim())
              const rowData: any = {}
              
              headers.forEach((header, index) => {
                rowData[header] = values[index] || ''
              })
              
              if (!rowData.english || !rowData.thai) {
                errors.push(`Row ${i + 1}: english and thai are required`)
                errorCount++
                continue
              }
              
              const result = await pool.query(
                'INSERT INTO admin_custom_vocabulary (english, thai, phonetic, example, category, difficulty, created_by) ' +
                'VALUES ($1, $2, $3, $4, $5, $6, $7) ' +
                'ON CONFLICT (english) DO UPDATE SET ' +
                'thai = $2, phonetic = $3, example = $4, category = $5, difficulty = $6, updated_at = NOW() ' +
                'RETURNING *',
                [
                  rowData.english,
                  rowData.thai,
                  rowData.phonetic || null,
                  rowData.example || null,
                  rowData.category || 'general',
                  parseInt(rowData.difficulty) || 2,
                  createdBy
                ]
              )
              
              successCount++
              console.log(`✅ API: Successfully processed word ${successCount}: ${rowData.english} -> ${rowData.thai}`)
              
              // Send progress update every 10 words
              if (successCount % 10 === 0) {
                console.log(`📊 API: Sending progress update - ${successCount}/${lines.length - 1} words completed`)
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  type: 'progress',
                  current: successCount,
                  total: lines.length - 1,
                  message: `นำเข้าไปแล้ว ${successCount} คำ...`
                })}\n\n`))
              }
            } catch (error) {
              errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
              errorCount++
            }
          }
          
          // Send completion
          console.log(`📊 API: CSV import completed - Success: ${successCount}, Errors: ${errorCount}`)
          console.log(`📊 API: Sending final result to client`)
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'complete',
            successCount,
            errorCount,
            total: lines.length - 1,
            errors: errors.slice(0, 10)
          })}\n\n`))
          
          controller.close()
        } catch (error) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown error'
          })}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })
    
  } catch (error) {
    console.error('CSV import error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
