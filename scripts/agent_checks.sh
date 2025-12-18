#!/usr/bin/env bash
# agent_checks.sh - Context-efficient checks for AI agents
# Inspired by: https://www.hlyr.dev/blog/context-efficient-backpressure
#
# Runs: typecheck → test → lint:fix
# On success: shows ✓ with summary
# On failure: shows only relevant output (filtered for tests)

set -e

run_check() {
    local name="$1"
    local cmd="$2"
    local tmp_file
    tmp_file=$(mktemp)

    if eval "$cmd" > "$tmp_file" 2>&1; then
        echo "✓ $name"
        rm -f "$tmp_file"
        return 0
    else
        echo "✗ $name"
        echo "Command: $cmd"
        echo "---"
        cat "$tmp_file"
        rm -f "$tmp_file"
        return 1
    fi
}

# Test-specific check that filters output to show only failures
run_test() {
    local tmp_file
    tmp_file=$(mktemp)

    if bun test > "$tmp_file" 2>&1; then
        # Extract pass count from summary line
        local count
        count=$(grep -oE "[0-9]+ pass" "$tmp_file" | grep -oE "[0-9]+" | tail -1)
        if [ -n "$count" ]; then
            echo "✓ test ($count passed)"
        else
            echo "✓ test"
        fi
        rm -f "$tmp_file"
        return 0
    else
        echo "✗ test"
        echo "Command: bun test"
        echo "---"
        # Filter to show only: file paths with failures, error blocks, fail lines, and summary
        awk '
            BEGIN { code_idx = 0 }

            # Track when we are in a file section with failures
            /^[a-zA-Z].*\.ts:$/ { current_file = $0; next }

            # Buffer code lines (they may precede an error)
            /^[0-9]+ \|/ {
                code_buffer[code_idx] = $0
                code_idx++
                next
            }

            # Caret line indicates error - flush buffered code in order
            /^ +\^$/ {
                if (current_file) { print current_file; current_file = "" }
                for (i = 0; i < code_idx; i++) print code_buffer[i]
                code_idx = 0
                delete code_buffer
                print
                in_error_block = 1
                next
            }

            # Error message
            /^error:/ {
                print
                next
            }

            # Additional error details (Received:, Expected:, at <anonymous>)
            in_error_block && /^(Received:|Expected:|      at )/ {
                print
                next
            }

            # Failed test line
            /^\(fail\)/ {
                print
                in_error_block = 0
                code_idx = 0
                delete code_buffer
                print ""
                next
            }

            # Clear buffer on pass lines
            /^\(pass\)/ {
                code_idx = 0
                delete code_buffer
                next
            }

            # Summary lines
            /^[0-9]+ tests? failed/ { print }
            /^Ran [0-9]+ tests/ { print }
            /^ [0-9]+ pass$/ { next }
            /^ [0-9]+ fail$/ { summary_fail = $0 }
            END { if (summary_fail) print summary_fail }
        ' "$tmp_file"
        rm -f "$tmp_file"
        return 1
    fi
}

# Check for explicit index imports that should use directory form
run_import_check() {
    local tmp_file
    tmp_file=$(mktemp)

    if grep -rE "from ['\"]\..*\/index(\.js|\.ts)?['\"]" apps packages --include="*.ts" --include="*.tsx" > "$tmp_file" 2>&1; then
        echo "✗ import-style"
        echo "Found explicit index imports (use directory form instead):"
        echo "---"
        cat "$tmp_file"
        echo ""
        echo "Fix: './shared/index.js' → './shared'"
        rm -f "$tmp_file"
        return 1
    else
        echo "✓ import-style"
        rm -f "$tmp_file"
        return 0
    fi
}

echo "Running agent checks..."
run_check "typecheck" "bun run typecheck"
run_test
run_check "lint:fix" "bun run lint:fix"
run_import_check
echo "All checks passed ✓"
