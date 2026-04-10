import json
import os
import sys

GHOST_ID = "E1NNH1VVJ60360"
REAL_ID = "E1Q42BJXF05FIL"


def fix_state_file(path: str) -> bool:
    with open(path) as f:
        state = json.load(f)

    try:
        resources = state["checkpoint"]["latest"]["resources"]
    except (KeyError, TypeError):
        print(f"  Skipping (no resources): {path}")
        return False

    before = len(resources)
    fixed = []
    changed = False

    for r in resources:
        if (
            r.get("type") == "aws:cloudfront/distribution:Distribution"
            and r.get("id") == GHOST_ID
        ):
            print(f"  Removed ghost distribution (delete={r.get('delete')})")
            changed = True
            continue
        r_str = json.dumps(r)
        if GHOST_ID in r_str:
            print(f"  Updated reference in: {r.get('urn', '').split('::')[-1]}")
            r = json.loads(r_str.replace(GHOST_ID, REAL_ID))
            changed = True
        fixed.append(r)

    if not changed:
        print(f"  No ghost distribution found")
        return False

    state["checkpoint"]["latest"]["resources"] = fixed
    print(f"  Resources: {before} -> {len(fixed)}")

    with open(path, "w") as f:
        json.dump(state, f, indent=2)
    print(f"  Saved: {path}")
    return True


def remove_locks(root: str):
    for dirpath, dirnames, filenames in os.walk(root):
        if ".pulumi" in dirpath and "locks" in dirpath:
            for fname in filenames:
                lock_path = os.path.join(dirpath, fname)
                print(f"  Removing lock: {lock_path}")
                os.remove(lock_path)


def scan_and_fix(root: str):
    print(f"Scanning {root} for Pulumi state files...")
    fixed_count = 0
    for dirpath, dirnames, filenames in os.walk(root):
        for fname in filenames:
            if fname == "production.json":
                path = os.path.join(dirpath, fname)
                print(f"Processing: {path}")
                if fix_state_file(path):
                    fixed_count += 1
    print(f"\nFixed {fixed_count} state file(s)")
    print("\nRemoving stale lock files...")
    remove_locks(root)


if __name__ == "__main__":
    if len(sys.argv) == 3 and sys.argv[1] != "--scan":
        # Legacy: fix_state.py <input> <output>
        input_file = sys.argv[1]
        output_file = sys.argv[2]
        import shutil
        shutil.copy2(input_file, output_file)
        fix_state_file(output_file)
    elif len(sys.argv) == 3 and sys.argv[1] == "--scan":
        scan_and_fix(sys.argv[2])
    else:
        print("Usage:")
        print("  fix_state.py --scan <root_dir>       # scan and fix all production.json files")
        print("  fix_state.py <input> <output>        # fix a single file")
        sys.exit(1)
