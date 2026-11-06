# Coordinator-authored public file mapping — Nemotron bookshelf

This mapping was written by the evaluation coordinator, outside the model's `work/` directory. It selects actual independently inspected deliverables. It does not amend or replace any author source, README, artifact index, native project or historical image. This is a local preparation record; it does not assert upload, publication, a completed provider session, or a completed eleven-case review.

## Approved final views

All three PNGs fully decode at 1920 × 1080 and show the complete outer frame. Their named cameras are present in the current native projects and reproduced by the same current author generator.

| View | Actual author file, relative to `work/` | Source project and selected camera | SHA-256 |
| --- | --- | --- | --- |
| Baseline front | `images/baseline_main_uncropped.png` | `blends/baseline.blend`, `Camera_Main` | `ba173f60702dcaf089e46945bdb1b0537f2b8ee8ef358d94a20a631b18f8ab71` |
| Baseline back | `images/baseline_back_uncropped.png` | `blends/baseline.blend`, `Camera_Back` | `c6465820762b61f6e0669e667f8b7bb1788cc8acbe4a55e5b3cfe5891adec935` |
| Modified front | `images/modified_main_uncropped.png` | `blends/modified.blend`, `Camera_Main` | `ff2e6b9484483eb82d4eedf135d587b05b9438c413847a0b2705c717701e91d2` |

The baseline file's saved active camera is `Camera_Back`; select `Camera_Main` for its front view. The modified file's saved active camera is `Camera_Main`. Both projects contain both named cameras, with 35 mm lenses. The baseline front has a usable but tight lower margin of approximately 4 pixels at 1080p; this is disclosed, not presented as perfect framing.

## Audited source package selection

`curated-source-files.json` selects six original author files, unmodified:

- `scripts/bookshelf.py` — current shared parametric generator, SHA-256 `368b58aef9f32efd937337e947bc6b116e3e9850a09e465f08982d9b5e30d228`.
- `blends/baseline.blend` — SHA-256 `9c768bef2315ec50b6b901479c7036a953b945ae64749a72b5e9533e8298ba25`.
- `blends/modified.blend` — SHA-256 `4ca10730622dbf1ab372ab7654f5656dbd6e85b584cd0679011f63d18498e2a3`.
- `json/baseline.json` and `json/modified.json` — author parameter/object reports.
- `README.md` — retained verbatim, with the handoff defect disclosed below.

The two projects passed the standard sandboxed, `--disable-autoexec`, read-only Blender inspection with matching before/after SHA-256 and no embedded Text blocks. Independent geometry and source-regeneration QA also passed. There are no required external image/library resources for these projects. Final PNG media are selected separately from the source ZIP using the table above.

The baseline is 800 × 300 × 1200 mm with 18 mm panels and three equal 376 mm clear compartments. The modified version is 1000 × 300 × 1200 mm, 18 mm panels, four equal 277.5 mm clear compartments. Book props remain outside the measured `Bookcase` collection.

## Author documentation defect

The author `README.md` and `artifacts.json` still name the earlier cropped `images/baseline_main.png`, `images/baseline_back.png`, and `images/modified_main.png` and omit the explicit named-camera selection. Those historical images remain unchanged in the private archive. They are excluded from the public selection. `artifacts.json` is excluded from this source ZIP because its image/log/preview references do not describe the selected current delivery. The original author README is not rewritten by the coordinator.

The source ZIP also excludes the historical `blends/baseline_back.blend`, historical renders, unused verification scripts, previews, render logs, source inputs, full prompts, model messages, private checkpoints and runtime state. This external coordinator mapping must accompany public download links to explain the author README's stale references.

## Rebuild and camera use

The author CLI uses `--camera main` or `--camera back` to select the camera. `--render main` or `--render back` names the render suffix; it does not itself select the camera. Render output is written beside `--out_json` as `<json-stem>_<render>.png`. The `_uncropped` PNG filenames in the table are the actual retained final files; rebuilding with a different output JSON name may produce different filenames.

To preserve the package's originals, extract it into a new directory and direct regenerated files to a new output directory. The independent QA used the unchanged author generator with baseline parameters `--width_mm 800 --depth_mm 300 --height_mm 1200 --thickness_mm 18 --compartments 3 --wood_color 8B5A3C`, and modified parameters `--width_mm 1000 --depth_mm 300 --height_mm 1200 --thickness_mm 18 --compartments 4 --wood_color 8B5A3C`, plus the intended `--camera`, `--out_blend`, and `--out_json`. Blender 5.2.3 was the verified runtime. No animation or audio is required for this static case.

## Acceptance scope

The coordinator accepted the core artwork under creation-first policy, with the documentation defect retained. The original provider session remains `attention` after HTTP 422; it is not relabeled completed. `allChecksPassed` and `fullModelReviewComplete` remain false. Supporting records are `evidence/coordinator-artifact-status.json`, `evidence/independent-qa/uncropped-current-state-summary.json`, and matching `qa/bookshelf/scene-inventory-*.json` files in the private batch archive; only sanitized publication evidence should be exposed publicly.


Coordinator publication mapping v2: PNG privacy derivatives

The three public bookshelf PNGs use coordinator metadata-only derivatives. Only the Blender PNG tEXt File field containing an absolute workstation path was removed. Every other PNG chunk, every IDAT byte, and all decoded pixels remain identical. Original author files and the v1 draft are preserved privately. This is not an artwork revision.

- baseline_main_uncropped.png: original SHA256 ba173f60702dcaf089e46945bdb1b0537f2b8ee8ef358d94a20a631b18f8ab71; public derivative SHA256 2abbae4f743a2ebff6b44f9d4381aebecdf4411e4821d922b4aad295341a7a38; decoded pixel SHA256 b77de4c1ebb2fae050be743368f8aa170ca4febb7ee061f39781723bedff02b7.
- baseline_back_uncropped.png: original SHA256 c6465820762b61f6e0669e667f8b7bb1788cc8acbe4a55e5b3cfe5891adec935; public derivative SHA256 d766e886d9c582f0e69b2a1e33bb26cf65542de4d9702c0cf5b0463305b2bb02; decoded pixel SHA256 62813621e9036cf23036dd33ee6df3390531569884964a9de554713290a7f048.
- modified_main_uncropped.png: original SHA256 ff2e6b9484483eb82d4eedf135d587b05b9438c413847a0b2705c717701e91d2; public derivative SHA256 3054f5299b8c2f6dc705b36cc7bf93c29a44cef37b18f362e7c2162a6b134379; decoded pixel SHA256 2d5b87fca0b8fc0f964eddb0564afd1a3f514e63815dbfda3f7a661f9a0f06be.
