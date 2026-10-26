#!/usr/bin/env python3
"""Empaqueta LiveDub para Chrome/Edge/Opera y para Firefox desde extension/.

Uso:  python tools/build.py          ->  dist/livedub-vX.Y.Z.zip y dist/livedub-firefox-vX.Y.Z.zip
La única fuente de verdad es extension/. El manifest de Firefox se genera aquí.
"""
import json, os, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "extension")
DIST = os.path.join(ROOT, "dist")


def firefox_manifest(m):
    m = json.loads(json.dumps(m))
    m["background"] = {"scripts": [m["background"]["service_worker"]]}
    m["browser_specific_settings"] = {
        "gecko": {
            "id": "livedub@lukybrou.github.io",
            "strict_min_version": "128.0",
            "data_collection_permissions": {"required": ["websiteContent"]},
        },
        "gecko_android": {"strict_min_version": "128.0"},
    }
    return m


def make_zip(out, manifest_override=None):
    if os.path.exists(out):
        os.remove(out)
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for r, _, fs in os.walk(SRC):
            for f in sorted(fs):
                p = os.path.join(r, f)
                name = os.path.relpath(p, SRC).replace(os.sep, "/")
                if name == "manifest.json" and manifest_override is not None:
                    z.writestr(name, json.dumps(manifest_override, indent=2, ensure_ascii=False) + "\n")
                else:
                    z.write(p, name)
    print("OK", os.path.relpath(out, ROOT))


def main():
    with open(os.path.join(SRC, "manifest.json"), encoding="utf-8") as f:
        m = json.load(f)
    v = m["version"]
    os.makedirs(DIST, exist_ok=True)
    make_zip(os.path.join(DIST, f"livedub-v{v}.zip"))
    make_zip(os.path.join(DIST, f"livedub-firefox-v{v}.zip"), firefox_manifest(m))


if __name__ == "__main__":
    main()
