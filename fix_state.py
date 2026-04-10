import json
import os
import sys

# Ghost distribution that no longer exists in AWS
GHOST_ID = "E1NNH1VVJ60360"
# Old distribution tied to www.aciujums.lt — remove from Pulumi state so it
# is no longer managed by SST. SST will create a fresh distribution instead.
# The old distribution stays in AWS and will be reconfigured as a proxy.
OLD_IMPORTED_ID = "E1Q42BJXF05FIL"

CF_DISTRIBUTION_TYPE = "aws:cloudfront/distribution:Distribution"
CF_WAITER_TYPE = "sst:aws:DistributionDeploymentWaiter"
CF_INVALIDATION_TYPE = "sst:aws:DistributionInvalidation"


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
        r_type = r.get("type", "")
        r_id = r.get("id", "")
        r_str = json.dumps(r)

        # Remove ghost distribution (never existed / was deleted in AWS)
        if r_type == CF_DISTRIBUTION_TYPE and r_id == GHOST_ID:
            print(f"  Removed ghost distribution (delete={r.get('delete')})")
            changed = True
            continue

        # Remove old imported distribution — SST will create a fresh one.
        # The physical distribution in AWS is NOT deleted; Pulumi just stops tracking it.
        if r_type == CF_DISTRIBUTION_TYPE and r_id == OLD_IMPORTED_ID:
            print(f"  Removed old imported distribution from state")
            changed = True
            continue

        # Remove waiter/invalidation resources that reference either old distribution.
        # They will be recreated against the new distribution on the next deploy.
        if r_type in (CF_WAITER_TYPE, CF_INVALIDATION_TYPE):
            if GHOST_ID in r_str or OLD_IMPORTED_ID in r_str:
                print(f"  Removed stale CF resource: {r_type.split(':')[-1]}")
                changed = True
                continue

        fixed.append(r)

    if not changed:
        print(f"  No changes needed")
        return False

    state["checkpoint"]["latest"]["resources"] = fixed
    print(f"  Resources: {before} -> {len(fixed)}")

    with open(path, "w") as f:
        json.dump(state, f, indent=2)
    print(f"  Saved: {path}")
    return True


def remove_locks(root: str):
    for dirpath, _, filenames in os.walk(root):
        if ".pulumi" in dirpath and "locks" in dirpath:
            for fname in filenames:
                lock_path = os.path.join(dirpath, fname)
                print(f"  Removing lock: {lock_path}")
                os.remove(lock_path)


def scan_and_fix(root: str):
    print(f"Scanning {root} for Pulumi state files...")
    fixed_count = 0
    for dirpath, _, filenames in os.walk(root):
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
    if len(sys.argv) == 3 and sys.argv[1] == "--scan":
        scan_and_fix(sys.argv[2])
    elif len(sys.argv) == 3:
        # Legacy single-file mode: fix_state.py <input> <output>
        import shutil
        shutil.copy2(sys.argv[1], sys.argv[2])
        fix_state_file(sys.argv[2])
    else:
        print("Usage:")
        print("  fix_state.py --scan <root_dir>  # scan and fix all production.json files")
        print("  fix_state.py <input> <output>   # fix a single file")
        sys.exit(1)
