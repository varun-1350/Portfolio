#!/usr/bin/env python3
"""
Neon AST & Code Metric Analyzer
Safely parses and evaluates Python source code using the standard library `ast` module.
Computes McCabe Cyclomatic Complexity, AST node hierarchies, and code hygiene metrics.
"""

import sys
import json
import ast
import time
import math

class ComplexityVisitor(ast.NodeVisitor):
    def __init__(self):
        self.complexity = 1  # Base complexity
        self.functions = []
        self.classes = []
        self.imports = []
        self.branches = 0
        self.loops = 0
        self.operators = 0
        self.operands = 0
        self.unique_operators = set()
        self.unique_operands = set()

    def visit_FunctionDef(self, node):
        func_comp = 1
        for child in ast.walk(node):
            if isinstance(child, (ast.If, ast.While, ast.For, ast.AsyncFor, ast.ExceptHandler, ast.With, ast.AsyncWith)):
                func_comp += 1
            elif isinstance(child, ast.BoolOp):
                func_comp += len(child.values) - 1
            elif isinstance(child, (ast.IfExp)):
                func_comp += 1
        
        self.functions.append({
            "name": node.name,
            "lineno": node.lineno,
            "args": [a.arg for a in node.args.args],
            "complexity": func_comp,
            "docstring": ast.get_docstring(node) is not None
        })
        self.generic_visit(node)

    def visit_AsyncFunctionDef(self, node):
        self.visit_FunctionDef(node)

    def visit_ClassDef(self, node):
        methods = [n.name for n in node.body if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))]
        self.classes.append({
            "name": node.name,
            "lineno": node.lineno,
            "methods": methods,
            "docstring": ast.get_docstring(node) is not None
        })
        self.generic_visit(node)

    def visit_Import(self, node):
        for alias in node.names:
            self.imports.append(alias.name)
        self.generic_visit(node)

    def visit_ImportFrom(self, node):
        mod = node.module or ""
        for alias in node.names:
            self.imports.append(f"{mod}.{alias.name}" if mod else alias.name)
        self.generic_visit(node)

    def visit_If(self, node):
        self.complexity += 1
        self.branches += 1
        self.generic_visit(node)

    def visit_IfExp(self, node):
        self.complexity += 1
        self.branches += 1
        self.generic_visit(node)

    def visit_For(self, node):
        self.complexity += 1
        self.loops += 1
        self.generic_visit(node)

    def visit_AsyncFor(self, node):
        self.complexity += 1
        self.loops += 1
        self.generic_visit(node)

    def visit_While(self, node):
        self.complexity += 1
        self.loops += 1
        self.generic_visit(node)

    def visit_ExceptHandler(self, node):
        self.complexity += 1
        self.generic_visit(node)

    def visit_BoolOp(self, node):
        self.complexity += len(node.values) - 1
        self.generic_visit(node)

def build_ast_tree(node, max_depth=3, current_depth=0):
    """Generates an aesthetic lightweight tree representation for UI graph rendering."""
    if current_depth >= max_depth:
        return {"name": type(node).__name__, "type": "leaf"}
    
    item = {
        "name": type(node).__name__,
        "type": "node",
        "children": []
    }
    
    # Specific attributes
    if hasattr(node, 'name'):
        item["label"] = node.name
    elif hasattr(node, 'id'):
        item["label"] = node.id
    elif hasattr(node, 'value') and isinstance(node.value, (str, int, float, bool)):
        item["label"] = str(node.value)
    
    for field, value in ast.iter_fields(node):
        if isinstance(value, list):
            for child in value:
                if isinstance(child, ast.AST):
                    child_dict = build_ast_tree(child, max_depth, current_depth + 1)
                    item["children"].append(child_dict)
        elif isinstance(value, ast.AST):
            child_dict = build_ast_tree(value, max_depth, current_depth + 1)
            item["children"].append(child_dict)
            
    # Cap children for clean visualization
    if len(item["children"]) > 8:
        overflow = len(item["children"]) - 8
        item["children"] = item["children"][:8]
        item["children"].append({"name": f"... +{overflow} nodes", "type": "leaf"})

    return item

def analyze_code(source_code: str) -> dict:
    start_time = time.perf_counter()
    lines = source_code.splitlines()
    total_loc = len(lines)
    blank_lines = sum(1 for line in lines if not line.strip())
    comment_lines = sum(1 for line in lines if line.strip().startswith('#'))
    logical_loc = total_loc - blank_lines - comment_lines

    try:
        tree = ast.parse(source_code)
    except SyntaxError as e:
        return {
            "success": False,
            "error_type": "SyntaxError",
            "message": str(e.msg),
            "line": e.lineno,
            "offset": e.offset,
            "text": e.text.strip() if e.text else "",
            "execution_ms": round((time.perf_counter() - start_time) * 1000, 2)
        }

    visitor = ComplexityVisitor()
    visitor.visit(tree)

    # Maintainability Index approximation (standard SE formula 171 - 5.2 * ln(V) - 0.23 * G - 16.2 * ln(LOC))
    safe_loc = max(1, logical_loc)
    safe_comp = max(1, visitor.complexity)
    raw_mi = 171 - (0.23 * safe_comp) - (16.2 * math.log(safe_loc))
    # Normalize between 0 and 100
    mi_score = max(0, min(100, round((raw_mi / 171) * 100, 1)))

    # Classification
    if safe_comp <= 5:
        rating = "Clean / Low Risk"
        badge_color = "#00F0FF" # Cyan
    elif safe_comp <= 10:
        rating = "Moderate / Manageable"
        badge_color = "#7000FF" # Electric Purple
    else:
        rating = "Complex / High Risk"
        badge_color = "#FF007A" # Neon Pink

    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
    ast_hierarchy = build_ast_tree(tree, max_depth=3)

    return {
        "success": True,
        "metrics": {
            "loc": total_loc,
            "logical_loc": logical_loc,
            "comments": comment_lines,
            "blanks": blank_lines,
            "cyclomatic_complexity": visitor.complexity,
            "complexity_rating": rating,
            "complexity_badge_color": badge_color,
            "maintainability_index": mi_score,
            "branches": visitor.branches,
            "loops": visitor.loops
        },
        "structure": {
            "functions": visitor.functions,
            "classes": visitor.classes,
            "imports": visitor.imports
        },
        "ast_tree": ast_hierarchy,
        "runtime_meta": {
            "python_version": sys.version.split()[0],
            "execution_ms": duration_ms
        }
    }

def main():
    code = ""
    if len(sys.argv) > 1:
        if sys.argv[1] == "--file" and len(sys.argv) > 2:
            try:
                with open(sys.argv[2], "r", encoding="utf-8") as f:
                    code = f.read()
            except Exception as e:
                print(json.dumps({"success": False, "error_type": "IOError", "message": str(e)}))
                sys.exit(1)
        elif sys.argv[1] == "--code" and len(sys.argv) > 2:
            code = sys.argv[2]
        elif sys.argv[1] == "--stdin":
            code = sys.stdin.read()
        else:
            # Check if argument is a file path
            arg = sys.argv[1]
            try:
                with open(arg, "r", encoding="utf-8") as f:
                    code = f.read()
            except Exception:
                code = arg
    else:
        # Default showcase code if empty
        code = '''# Default Portfolio Showcase Algorithm
def quick_sort_matrix(items: list, threshold: int = 10) -> list:
    """Sorts input array with hybrid partition optimization."""
    if len(items) <= 1:
        return items
    
    pivot = items[len(items) // 2]
    left = [x for x in items if x < pivot]
    middle = [x for x in items if x == pivot]
    right = [x for x in items if x > pivot]
    
    if len(items) > threshold:
        return quick_sort_matrix(left) + middle + quick_sort_matrix(right)
    return sorted(items)
'''

    result = analyze_code(code)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
