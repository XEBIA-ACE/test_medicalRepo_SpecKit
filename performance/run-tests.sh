#!/bin/bash

# Performance Testing Script for Medication Repository Service
# This script runs comprehensive performance tests and generates reports

set -e

echo "🚀 Starting Performance Testing for Medication Repository Service"
echo "=================================================="

# Configuration
SERVICE_URL=${SERVICE_URL:-"http://localhost:3000"}
RESULTS_DIR="performance/results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$RESULTS_DIR/performance_report_$TIMESTAMP.json"

# Create results directory
mkdir -p "$RESULTS_DIR"

# Check if service is running
echo "🔍 Checking service availability..."
if ! curl -f -s "$SERVICE_URL/health" > /dev/null; then
    echo "❌ Service is not available at $SERVICE_URL"
    echo "Please start the service first:"
    echo "  npm run docker:run"
    echo "  or"
    echo "  npm start"
    exit 1
fi

echo "✅ Service is available at $SERVICE_URL"

# Install dependencies if needed
if ! command -v artillery &> /dev/null; then
    echo "📦 Installing Artillery..."
    npm install -g artillery
fi

# Run load tests
echo "🔥 Running load tests..."
echo "Target: $SERVICE_URL"
echo "Results will be saved to: $REPORT_FILE"

artillery run \
    --target "$SERVICE_URL" \
    --output "$REPORT_FILE" \
    performance/load-test.yml

# Generate HTML report
echo "📊 Generating HTML report..."
HTML_REPORT="$RESULTS_DIR/performance_report_$TIMESTAMP.html"
artillery report --output "$HTML_REPORT" "$REPORT_FILE"

# Analyze results
echo "📈 Analyzing results..."
ANALYSIS_FILE="$RESULTS_DIR/analysis_$TIMESTAMP.txt"

# Extract key metrics using jq (if available)
if command -v jq &> /dev/null; then
    echo "Performance Test Analysis - $TIMESTAMP" > "$ANALYSIS_FILE"
    echo "========================================" >> "$ANALYSIS_FILE"
    echo "" >> "$ANALYSIS_FILE"
    
    # Response time analysis
    echo "Response Time Analysis:" >> "$ANALYSIS_FILE"
    echo "----------------------" >> "$ANALYSIS_FILE"
    
    # Extract response time percentiles
    P50=$(jq -r '.aggregate.latency.p50 // "N/A"' "$REPORT_FILE")
    P95=$(jq -r '.aggregate.latency.p95 // "N/A"' "$REPORT_FILE")
    P99=$(jq -r '.aggregate.latency.p99 // "N/A"' "$REPORT_FILE")
    MAX=$(jq -r '.aggregate.latency.max // "N/A"' "$REPORT_FILE")
    MIN=$(jq -r '.aggregate.latency.min // "N/A"' "$REPORT_FILE")
    
    echo "  50th percentile (median): ${P50}ms" >> "$ANALYSIS_FILE"
    echo "  95th percentile: ${P95}ms" >> "$ANALYSIS_FILE"
    echo "  99th percentile: ${P99}ms" >> "$ANALYSIS_FILE"
    echo "  Maximum: ${MAX}ms" >> "$ANALYSIS_FILE"
    echo "  Minimum: ${MIN}ms" >> "$ANALYSIS_FILE"
    echo "" >> "$ANALYSIS_FILE"
    
    # Throughput analysis
    echo "Throughput Analysis:" >> "$ANALYSIS_FILE"
    echo "-------------------" >> "$ANALYSIS_FILE"
    
    RPS=$(jq -r '.aggregate.rps.mean // "N/A"' "$REPORT_FILE")
    TOTAL_REQUESTS=$(jq -r '.aggregate.requestsCompleted // "N/A"' "$REPORT_FILE")
    
    echo "  Average RPS: $RPS" >> "$ANALYSIS_FILE"
    echo "  Total Requests: $TOTAL_REQUESTS" >> "$ANALYSIS_FILE"
    echo "" >> "$ANALYSIS_FILE"
    
    # Error analysis
    echo "Error Analysis:" >> "$ANALYSIS_FILE"
    echo "--------------" >> "$ANALYSIS_FILE"
    
    ERROR_RATE=$(jq -r '.aggregate.codes | to_entries | map(select(.key | startswith("4") or startswith("5"))) | map(.value) | add // 0' "$REPORT_FILE")
    SUCCESS_RATE=$(jq -r '.aggregate.codes."200" // 0' "$REPORT_FILE")
    
    echo "  Error responses (4xx/5xx): $ERROR_RATE" >> "$ANALYSIS_FILE"
    echo "  Successful responses (200): $SUCCESS_RATE" >> "$ANALYSIS_FILE"
    echo "" >> "$ANALYSIS_FILE"
    
    # SLA compliance check
    echo "SLA Compliance Check:" >> "$ANALYSIS_FILE"
    echo "--------------------" >> "$ANALYSIS_FILE"
    
    if [ "$P95" != "N/A" ] && [ "$P95" != "null" ]; then
        if (( $(echo "$P95 <= 500" | bc -l) )); then
            echo "  ✅ 95th percentile response time ($P95ms) meets SLA (<500ms)" >> "$ANALYSIS_FILE"
        else
            echo "  ❌ 95th percentile response time ($P95ms) exceeds SLA (>500ms)" >> "$ANALYSIS_FILE"
        fi
    else
        echo "  ⚠️  Unable to determine SLA compliance (no P95 data)" >> "$ANALYSIS_FILE"
    fi
    
    # Display analysis
    cat "$ANALYSIS_FILE"
else
    echo "⚠️  jq not available - skipping detailed analysis"
    echo "Install jq for detailed performance analysis: https://stedolan.github.io/jq/"
fi

# Summary
echo ""
echo "📋 Performance Test Summary"
echo "=========================="
echo "  Test completed: $(date)"
echo "  Results saved to: $REPORT_FILE"
echo "  HTML report: $HTML_REPORT"
if [ -f "$ANALYSIS_FILE" ]; then
    echo "  Analysis: $ANALYSIS_FILE"
fi
echo ""
echo "🎯 Key Performance Targets:"
echo "  - Response time: <500ms (95th percentile)"
echo "  - Availability: >99.9%"
echo "  - Error rate: <1%"
echo ""

# Check if HTML report was generated successfully
if [ -f "$HTML_REPORT" ]; then
    echo "📊 Open the HTML report in your browser:"
    echo "  file://$(pwd)/$HTML_REPORT"
else
    echo "⚠️  HTML report generation failed"
fi

echo ""
echo "✅ Performance testing completed!"