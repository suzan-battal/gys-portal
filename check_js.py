#!/usr/bin/env python3
import glob

def check_brackets(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()
    
    stack = []
    lines = code.split('\n')
    for line_idx, line in enumerate(lines, 1):
        # Ignore comments
        line_clean = line.split('//')[0]
        for char in line_clean:
            if char in '({[':
                stack.append((char, line_idx))
            elif char in ')}]':
                if not stack:
                    print(f"Error in {file_path}:{line_idx}: Unmatched '{char}'")
                    return False
                last_char, last_line = stack.pop()
                if (char == ')' and last_char != '(') or \
                   (char == '}' and last_char != '{') or \
                   (char == ']' and last_char != '['):
                    print(f"Mismatch in {file_path}:{line_idx}: '{char}' doesn't match '{last_char}' from line {last_line}")
                    return False

    if stack:
        print(f"Error in {file_path}: Unclosed {stack[-1]}")
        return False
    print(f"✓ {file_path} balanced!")
    return True

for f in glob.glob("static/js/*.js"):
    check_brackets(f)
