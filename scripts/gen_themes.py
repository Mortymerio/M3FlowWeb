#!/usr/bin/env python3
"""Generate themes.ts with 20 new VS Code themes + existing ones."""

THEMES = {
    # === EXISTING THEMES (preserved exactly) ===
    "midnight-indigo": {
        "dark": False,
        "sidebar": ("#1b1c28","#1b1c28","slate-300","#2d3042","#3b3e54 text-white","#101019"),
        "list": ("#f9f9fb","#f9f9fb","slate-700","#f8f9fa","#eef2f9","slate-200"),
        "editor": ("white","#1b1c28","slate-800","slate-200"),
        "dropdown": ("white","slate-800"),
        "preview": ("white","prose","light"),
    },
    "cloud-nine": {
        "dark": False,
        "sidebar": ("#f4f4f7","#f4f4f7","slate-600","#e4e4e9","white text-slate-900 shadow-sm","slate-200"),
        "list": ("white","white","slate-700","#f8f9fa","#eef2f9","slate-200"),
        "editor": ("white","#f4f4f7","slate-800","slate-200"),
        "dropdown": ("white","slate-800"),
        "preview": ("#fafbfc","prose","light"),
    },
    "arctic-night": {
        "dark": True,
        "sidebar": ("#eceff4","#eceff4","#4c566a","#e5e9f0","#d8dee9 text-[#2e3440]","#d8dee9"),
        "list": ("#434c5e","#434c5e","#eceff4","#4c566a","#3b4252","#3b4252"),
        "editor": ("#2e3440","#eceff4","#eceff4","#3b4252"),
        "dropdown": ("#3b4252","#eceff4"),
        "preview": ("#2e3440","prose prose-invert prose-p:text-[#e5e9f0] prose-h1:text-white","dark"),
    },
    "cyber-ronin": {
        "dark": True,
        "sidebar": ("#1e2329","#171b1f","#8892b0","#252b33","#2b303b text-[#58a6ff]","#171b1f"),
        "list": ("#252b33","#1e2329","#c9d1d9","#2b303b","#343a45","#1e2329"),
        "editor": ("#15191e","#1e2329","#c9d1d9","#252b33"),
        "dropdown": ("#1e2329","#c9d1d9"),
        "preview": ("#1a1e24","prose prose-invert prose-p:text-[#8b9eb5] prose-h1:text-[#64ffda] prose-a:text-[#58a6ff]","dark"),
    },

    # === 10 DARK THEMES (Top VS Code) ===
    "one-dark-pro": {
        "dark": True,
        "sidebar": ("#21252b","#21252b","#abb2bf","#2c313a","#3a3f4b text-[#61afef]","#181a1f"),
        "list": ("#282c34","#21252b","#abb2bf","#2c313a","#3e4451","#21252b"),
        "editor": ("#282c34","#21252b","#abb2bf","#3b4048"),
        "dropdown": ("#21252b","#abb2bf"),
        "preview": ("#282c34","prose prose-invert prose-p:text-[#abb2bf] prose-h1:text-[#e5c07b] prose-a:text-[#61afef]","dark"),
    },
    "dracula": {
        "dark": True,
        "sidebar": ("#21222c","#191a21","#f8f8f2","#2b2d3a","#44475a text-[#bd93f9]","#191a21"),
        "list": ("#282a36","#21222c","#f8f8f2","#343746","#44475a","#21222c"),
        "editor": ("#282a36","#21222c","#f8f8f2","#44475a"),
        "dropdown": ("#21222c","#f8f8f2"),
        "preview": ("#282a36","prose prose-invert prose-p:text-[#f8f8f2] prose-h1:text-[#bd93f9] prose-a:text-[#8be9fd]","dark"),
    },
    "tokyo-night": {
        "dark": True,
        "sidebar": ("#1a1b26","#16161e","#a9b1d6","#24283b","#33467c text-[#7aa2f7]","#101014"),
        "list": ("#1a1b26","#16161e","#a9b1d6","#24283b","#292e42","#16161e"),
        "editor": ("#1a1b26","#16161e","#a9b1d6","#292e42"),
        "dropdown": ("#16161e","#a9b1d6"),
        "preview": ("#1a1b26","prose prose-invert prose-p:text-[#a9b1d6] prose-h1:text-[#c0caf5] prose-a:text-[#7aa2f7]","dark"),
    },
    "github-dark": {
        "dark": True,
        "sidebar": ("#0d1117","#010409","#c9d1d9","#161b22","#1f2937 text-[#58a6ff]","#010409"),
        "list": ("#0d1117","#010409","#c9d1d9","#161b22","#1f2937","#010409"),
        "editor": ("#0d1117","#010409","#c9d1d9","#21262d"),
        "dropdown": ("#161b22","#c9d1d9"),
        "preview": ("#0d1117","prose prose-invert prose-p:text-[#c9d1d9] prose-h1:text-white prose-a:text-[#58a6ff]","dark"),
    },
    "night-owl": {
        "dark": True,
        "sidebar": ("#011627","#011221","#d6deeb","#0b2942","#1d3b53 text-[#82aaff]","#010e1a"),
        "list": ("#011627","#011221","#d6deeb","#0b2942","#1d3b53","#011221"),
        "editor": ("#011627","#011221","#d6deeb","#122d42"),
        "dropdown": ("#011221","#d6deeb"),
        "preview": ("#011627","prose prose-invert prose-p:text-[#d6deeb] prose-h1:text-[#c792ea] prose-a:text-[#82aaff]","dark"),
    },
    "monokai-pro": {
        "dark": True,
        "sidebar": ("#2d2a2e","#221f22","#fcfcfa","#3b383e","#49464e text-[#ffd866]","#19181a"),
        "list": ("#2d2a2e","#221f22","#fcfcfa","#3b383e","#49464e","#221f22"),
        "editor": ("#2d2a2e","#221f22","#fcfcfa","#49464e"),
        "dropdown": ("#221f22","#fcfcfa"),
        "preview": ("#2d2a2e","prose prose-invert prose-p:text-[#fcfcfa] prose-h1:text-[#ffd866] prose-a:text-[#78dce8]","dark"),
    },
    "ayu-dark": {
        "dark": True,
        "sidebar": ("#0b0e14","#0b0e14","#bfbdb6","#11151c","#1a1e28 text-[#e6b450]","#060809"),
        "list": ("#0d1017","#0b0e14","#bfbdb6","#131721","#1a1e28","#0b0e14"),
        "editor": ("#0b0e14","#0b0e14","#bfbdb6","#131721"),
        "dropdown": ("#0b0e14","#bfbdb6"),
        "preview": ("#0b0e14","prose prose-invert prose-p:text-[#bfbdb6] prose-h1:text-[#e6b450] prose-a:text-[#39bae6]","dark"),
    },
    "winter-is-coming": {
        "dark": True,
        "sidebar": ("#011627","#001122","#d6deeb","#0b2942","#172a3a text-[#87e2ff]","#001122"),
        "list": ("#011627","#001122","#d6deeb","#0e293f","#172a3a","#001122"),
        "editor": ("#011627","#001122","#d6deeb","#122d42"),
        "dropdown": ("#001122","#d6deeb"),
        "preview": ("#011627","prose prose-invert prose-p:text-[#d6deeb] prose-h1:text-[#87e2ff] prose-a:text-[#80cbc4]","dark"),
    },
    "shades-of-purple": {
        "dark": True,
        "sidebar": ("#2d2b55","#1e1d40","#e0d8ff","#3a3875","#4b49a5 text-[#fad000]","#1e1d40"),
        "list": ("#2d2b55","#1e1d40","#e0d8ff","#3a3875","#4b49a5","#1e1d40"),
        "editor": ("#2d2b55","#1e1d40","#e0d8ff","#3a3875"),
        "dropdown": ("#1e1d40","#e0d8ff"),
        "preview": ("#2d2b55","prose prose-invert prose-p:text-[#e0d8ff] prose-h1:text-[#fad000] prose-a:text-[#ff7edb]","dark"),
    },
    "catppuccin-mocha": {
        "dark": True,
        "sidebar": ("#1e1e2e","#181825","#cdd6f4","#28283d","#313244 text-[#cba6f7]","#11111b"),
        "list": ("#1e1e2e","#181825","#cdd6f4","#28283d","#313244","#181825"),
        "editor": ("#1e1e2e","#181825","#cdd6f4","#313244"),
        "dropdown": ("#181825","#cdd6f4"),
        "preview": ("#1e1e2e","prose prose-invert prose-p:text-[#cdd6f4] prose-h1:text-[#cba6f7] prose-a:text-[#89b4fa]","dark"),
    },

    # === 10 LIGHT THEMES (Top VS Code) ===
    "github-light": {
        "dark": False,
        "sidebar": ("#f6f8fa","#f0f2f5","#24292f","#e8ebef","white text-[#0969da] shadow-sm","#d0d7de"),
        "list": ("white","#f6f8fa","#24292f","#f3f5f7","#ddf4ff","#d0d7de"),
        "editor": ("white","#f6f8fa","#24292f","#d0d7de"),
        "dropdown": ("white","#24292f"),
        "preview": ("#ffffff","prose prose-p:text-[#24292f] prose-h1:text-[#1f2328] prose-a:text-[#0969da]","light"),
    },
    "one-light": {
        "dark": False,
        "sidebar": ("#fafafa","#f0f0f0","#383a42","#e5e5e6","#dbdbdc text-[#4078f2]","#dbdbdc"),
        "list": ("#fafafa","#f0f0f0","#383a42","#ededee","#d5e4f7","#dbdbdc"),
        "editor": ("#fafafa","#f0f0f0","#383a42","#e0e0e0"),
        "dropdown": ("#fafafa","#383a42"),
        "preview": ("#fafafa","prose prose-p:text-[#383a42] prose-h1:text-[#e45649] prose-a:text-[#4078f2]","light"),
    },
    "solarized-light": {
        "dark": False,
        "sidebar": ("#fdf6e3","#eee8d5","#586e75","#e6dfca","#d6cdb5 text-[#268bd2]","#d3cbb7"),
        "list": ("#fdf6e3","#eee8d5","#586e75","#f0e9d3","#ddd5be","#d3cbb7"),
        "editor": ("#fdf6e3","#eee8d5","#586e75","#d3cbb7"),
        "dropdown": ("#fdf6e3","#586e75"),
        "preview": ("#fdf6e3","prose prose-p:text-[#586e75] prose-h1:text-[#073642] prose-a:text-[#268bd2]","light"),
    },
    "quiet-light": {
        "dark": False,
        "sidebar": ("#f5f5f5","#ebebeb","#333333","#e0e0e0","#d4d4d4 text-[#7a3e9d]","#d4d4d4"),
        "list": ("#f5f5f5","#ebebeb","#333333","#eaeaea","#e0dff5","#d4d4d4"),
        "editor": ("#f5f5f5","#ebebeb","#333333","#d4d4d4"),
        "dropdown": ("#f5f5f5","#333333"),
        "preview": ("#f5f5f5","prose prose-p:text-[#333333] prose-h1:text-[#7a3e9d] prose-a:text-[#4b69c6]","light"),
    },
    "ayu-light": {
        "dark": False,
        "sidebar": ("#fcfcfc","#f3f3f3","#5c6166","#e8e8e8","#d9d9d9 text-[#f29718]","#dcdcdc"),
        "list": ("#fcfcfc","#f3f3f3","#5c6166","#efefef","#fff3d6","#dcdcdc"),
        "editor": ("#fcfcfc","#f3f3f3","#5c6166","#dcdcdc"),
        "dropdown": ("#fcfcfc","#5c6166"),
        "preview": ("#fcfcfc","prose prose-p:text-[#5c6166] prose-h1:text-[#f29718] prose-a:text-[#36a3d9]","light"),
    },
    "catppuccin-latte": {
        "dark": False,
        "sidebar": ("#eff1f5","#e6e9ef","#4c4f69","#dce0e8","#ccd0da text-[#8839ef]","#ccd0da"),
        "list": ("#eff1f5","#e6e9ef","#4c4f69","#e4e7ed","#dddaf8","#ccd0da"),
        "editor": ("#eff1f5","#e6e9ef","#4c4f69","#ccd0da"),
        "dropdown": ("#eff1f5","#4c4f69"),
        "preview": ("#eff1f5","prose prose-p:text-[#4c4f69] prose-h1:text-[#8839ef] prose-a:text-[#1e66f5]","light"),
    },
    "rose-pine-dawn": {
        "dark": False,
        "sidebar": ("#faf4ed","#f2e9de","#575279","#e8dfd5","#dfdad9 text-[#907aa9]","#dfdad9"),
        "list": ("#faf4ed","#f2e9de","#575279","#f0e7dc","#e9ddd5","#dfdad9"),
        "editor": ("#faf4ed","#f2e9de","#575279","#dfdad9"),
        "dropdown": ("#faf4ed","#575279"),
        "preview": ("#faf4ed","prose prose-p:text-[#575279] prose-h1:text-[#907aa9] prose-a:text-[#56949f]","light"),
    },
    "material-lighter": {
        "dark": False,
        "sidebar": ("#fafafa","#f0f0f0","#546e7a","#e7e7e8","#ccd7da text-[#6182b8]","#e0e0e0"),
        "list": ("#fafafa","#f0f0f0","#546e7a","#eeeeee","#d6ebf5","#e0e0e0"),
        "editor": ("#fafafa","#f0f0f0","#546e7a","#e0e0e0"),
        "dropdown": ("#fafafa","#546e7a"),
        "preview": ("#fafafa","prose prose-p:text-[#546e7a] prose-h1:text-[#6182b8] prose-a:text-[#39adb5]","light"),
    },
    "nord-light": {
        "dark": False,
        "sidebar": ("#eceff4","#e5e9f0","#2e3440","#d8dee9","#c9d1de text-[#5e81ac]","#d8dee9"),
        "list": ("#eceff4","#e5e9f0","#2e3440","#e0e5ed","#d0d8e5","#d8dee9"),
        "editor": ("#eceff4","#e5e9f0","#2e3440","#d8dee9"),
        "dropdown": ("#eceff4","#2e3440"),
        "preview": ("#eceff4","prose prose-p:text-[#2e3440] prose-h1:text-[#5e81ac] prose-a:text-[#5e81ac]","light"),
    },
    "everforest-light": {
        "dark": False,
        "sidebar": ("#fdf6e3","#f4f0d9","#5c6a72","#e9e5ce","#d5d0b8 text-[#8da101]","#d5d0b8"),
        "list": ("#fdf6e3","#f4f0d9","#5c6a72","#efebd4","#e0dcc7","#d5d0b8"),
        "editor": ("#fdf6e3","#f4f0d9","#5c6a72","#d5d0b8"),
        "dropdown": ("#fdf6e3","#5c6a72"),
        "preview": ("#fdf6e3","prose prose-p:text-[#5c6a72] prose-h1:text-[#8da101] prose-a:text-[#35a77c]","light"),
    },
}

def is_hex(c):
    return c.startswith('#')

def bg(c):
    return f"bg-[{c}]" if is_hex(c) else f"bg-{c}"

def txt(c):
    return f"text-[{c}]" if is_hex(c) else f"text-{c}"

def brd(c):
    return f"border-[{c}]" if is_hex(c) else f"border-{c}"

def hvr(c):
    return f"hover:bg-[{c}]" if is_hex(c) else f"hover:bg-{c}"

def gen_theme(name, t):
    s = t["sidebar"]
    l = t["list"]
    e = t["editor"]
    d = t["dropdown"]
    p = t["preview"]
    dark = t["dark"]

    lines = []
    lines.append(f"  '{name}': {{")
    lines.append(f"    isDark: {'true' if dark else 'false'},")
    lines.append(f"    sidebarBg: '{bg(s[0])}',")
    lines.append(f"    sidebarHeader: '{bg(s[1])}',")
    lines.append(f"    sidebarText: '{txt(s[2])}',")
    lines.append(f"    sidebarHover: '{hvr(s[3])}',")
    lines.append(f"    sidebarActive: '{bg(s[4].split(' ')[0]) if ' ' not in s[4] else s[4].replace(s[4].split(' ')[0], bg(s[4].split(' ')[0]))}',")
    lines.append(f"    sidebarBorder: '{brd(s[5])}',")
    lines.append(f"    listBg: '{bg(l[0])}',")
    lines.append(f"    listHeader: '{bg(l[1])}',")
    lines.append(f"    listText: '{txt(l[2])}',")
    lines.append(f"    listHover: '{hvr(l[3])}',")
    lines.append(f"    listActive: '{bg(l[4])}',")
    lines.append(f"    listBorder: '{brd(l[5])}',")
    lines.append(f"    editorBg: '{bg(e[0])}',")
    lines.append(f"    editorHeader: '{bg(e[1])}',")
    lines.append(f"    editorText: '{txt(e[2])}',")
    lines.append(f"    editorBorder: '{brd(e[3])}',")
    lines.append(f"    dropdownBg: '{bg(d[0])}',")
    lines.append(f"    dropdownText: '{txt(d[1])}',")
    lines.append(f"    previewBg: '{bg(p[0])}',")
    lines.append(f"    prose: '{p[1]}',")
    lines.append(f"    codeTheme: '{p[2]}'")
    lines.append(f"  }},")
    return '\n'.join(lines)

# Fix sidebarActive generation
def gen_theme_fixed(name, t):
    s = t["sidebar"]
    l = t["list"]
    e = t["editor"]
    d = t["dropdown"]
    p = t["preview"]
    dark = t["dark"]

    # Handle sidebarActive which may contain extra classes
    sa = s[4]
    parts = sa.split(' ')
    sa_bg = bg(parts[0])
    sa_extra = ' '.join(parts[1:]) if len(parts) > 1 else ''
    sa_full = f"{sa_bg} {sa_extra}".strip() if sa_extra else sa_bg

    lines = []
    lines.append(f"  '{name}': {{")
    lines.append(f"    isDark: {'true' if dark else 'false'},")
    lines.append(f"    sidebarBg: '{bg(s[0])}',")
    lines.append(f"    sidebarHeader: '{bg(s[1])}',")
    lines.append(f"    sidebarText: '{txt(s[2])}',")
    lines.append(f"    sidebarHover: '{hvr(s[3])}',")
    lines.append(f"    sidebarActive: '{sa_full}',")
    lines.append(f"    sidebarBorder: '{brd(s[5])}',")
    lines.append(f"    listBg: '{bg(l[0])}',")
    lines.append(f"    listHeader: '{bg(l[1])}',")
    lines.append(f"    listText: '{txt(l[2])}',")
    lines.append(f"    listHover: '{hvr(l[3])}',")
    lines.append(f"    listActive: '{bg(l[4])}',")
    lines.append(f"    listBorder: '{brd(l[5])}',")
    lines.append(f"    editorBg: '{bg(e[0])}',")
    lines.append(f"    editorHeader: '{bg(e[1])}',")
    lines.append(f"    editorText: '{txt(e[2])}',")
    lines.append(f"    editorBorder: '{brd(e[3])}',")
    lines.append(f"    dropdownBg: '{bg(d[0])}',")
    lines.append(f"    dropdownText: '{txt(d[1])}',")
    lines.append(f"    previewBg: '{bg(p[0])}',")
    lines.append(f"    prose: '{p[1]}',")
    lines.append(f"    codeTheme: '{p[2]}'")
    lines.append(f"  }},")
    return '\n'.join(lines)

# Generate output
output_lines = ["export const THEMES: Record<string, any> = {"]
for name, t in THEMES.items():
    output_lines.append(gen_theme_fixed(name, t))

# Add custom theme (special case)
output_lines.append("""  'custom': {
    isDark: true,
    sidebarBg: 'bg-[var(--custom-sidebar-bg)]',
    sidebarHeader: 'bg-[var(--custom-sidebar-header)]',
    sidebarText: 'text-[var(--custom-sidebar-text)]',
    sidebarHover: 'hover:bg-white/5',
    sidebarActive: 'bg-white/10 text-white shadow-lg',
    sidebarBorder: 'border-white/10',
    listBg: 'bg-[var(--custom-list-bg)]',
    listHeader: 'bg-[var(--custom-list-header)]',
    listText: 'text-[var(--custom-list-text)]',
    listHover: 'hover:bg-black/10',
    listActive: 'bg-white/10',
    listBorder: 'border-white/10',
    editorBg: 'bg-[var(--custom-editor-bg)]',
    editorHeader: 'bg-[var(--custom-editor-header)]',
    editorText: 'text-[var(--custom-editor-text)]',
    editorBorder: 'border-white/10',
    dropdownBg: 'bg-slate-800',
    dropdownText: 'text-white',
    previewBg: 'bg-[var(--custom-preview-bg)]',
    prose: 'prose prose-invert',
    codeTheme: 'dark'
  },""")

output_lines.append("};")
output_lines.append("")

with open('/home/morty/Desktop/ag/M3Flow/src/themes.ts', 'w') as f:
    f.write('\n'.join(output_lines))

print("themes.ts generated successfully!")
print(f"Total themes: {len(THEMES) + 1}")  # +1 for custom
