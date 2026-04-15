import sys
with open(r'c:\Users\geral\.gemini\antigravity\scratch\alphasignal\backend\routes\ai_engine.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
in_handle = False
for line in lines:
    if 'def handle_explain_options(' in line:
        in_handle = True
        new_lines.append(line)
        continue
    
    if in_handle and 'def ' in line:
        in_handle = False

    if in_handle and 'put_oi = post_data.get(' in line:
        new_lines.append(line)
        new_lines.append("        skew = post_data.get('skew', 'N/A')\n")
        new_lines.append("        exp_move = post_data.get('exp_move', 'N/A')\n")
        new_lines.append("        zero_gamma = post_data.get('zero_gamma', 'N/A')\n")
        new_lines.append("        anomalies = post_data.get('anomalies', 0)\n")
        continue
        
    if in_handle and 'f"Call OI' in line:
        new_lines.append('            f"Zero-Gamma Pivot: ${zero_gamma}\\n"\n')
        new_lines.append('            f"Expected 7D Move: ±${exp_move}\\n"\n')
        new_lines.append('            f"25-Delta Skew: {skew}%\\n"\n')
        new_lines.append('            f"Unusual Flow Anomalies: {anomalies} strikes\\n"\n')
        continue
        
    if in_handle and 'f"Put OI' in line:
        # skip it
        continue
        
    if in_handle and 'First paragraph: Summarize the current positioning based on the Put/Call Ratio, Max Pain, and Implied Volatility' in line:
        new_lines.append('            "First paragraph: Summarize institutional positioning based on PCR, the Expected Move boundaries, and whether they are pinned at the Zero-Gamma strike. "\n')
        continue
        
    if in_handle and 'Second paragraph: Give an actionable takeaway for a trader based on the IV Rank and Open Interest imbalance' in line:
        new_lines.append('            "Second paragraph: Give an actionable structural takeaway based on the Skew (are they heavily bidding puts for fear or calls for FOMO?) and identify if there is unusual volume anomalous flow occurring today. "\n')
        continue

    new_lines.append(line)

with open(r'c:\Users\geral\.gemini\antigravity\scratch\alphasignal\backend\routes\ai_engine.py', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
