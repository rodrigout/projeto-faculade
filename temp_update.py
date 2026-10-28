import os

def replace_in_file(path, replacements):
    if not os.path.exists(path):
        return
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    for old, new in replacements:
        content = content.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

replacements_main = [
    ('cap_cm3 = 5000.0 if is_small_box else 8000.0', 'cap_cm3 = 125000.0'),
    ('length = 20.0 if is_small_box else 32.0', 'length = 50.0'),
    ('width = 15.0 if is_small_box else 15.625', 'width = 50.0'),
    ('height = 16.66 if is_small_box else 16.0', 'height = 50.0'),
    ('~8.000cm³', '~125.000ccm³'),
    ('~5.000cm³', '~125.000ccm³')
]
replace_in_file('backend/main.py', replacements_main)

replacements_index = [
    ('g/ccm³', 'g/ccm³'),
    ('t úteis', 'g úteis')
]
replace_in_file('src/routes/index.tsx', replacements_index)

replacements_boxcard = [
    ('>cm³<', '>ccm³<'),
    ('>g<', '>g<'),
    (' cm³', ' ccm³'),
    (' t', ' g'),
    ('g/ccm³', 'g/ccm³'),
    ('Toneladas', 'Gramas'),
    ('toneladas', 'gramas')
]
replace_in_file('src/components/scada/BoxCard.tsx', replacements_boxcard)

replacements_boxid = [
    (' cm³', ' ccm³'),
    ('>cm³<', '>ccm³<'),
    ('"cm³"', '"ccm³"'),
    (' t', ' g'),
    ('>g<', '>g<'),
    ('"t"', '"g"'),
    ('g/ccm³', 'g/ccm³'),
    ('"g/ccm³"', '"g/ccm³"'),
    ('Toneladas', 'Gramas'),
    ('toneladas', 'gramas'),
    ('× {box.geometry_height_cm.toFixed(2)} m', '× {box.geometry_height_cm.toFixed(2)} cm')
]
replace_in_file('src/routes/box.$boxId.tsx', replacements_boxid)

replacements_cabine = [
    (' t', ' g'),
    ('>g<', '>g<'),
    ('"t"', '"g"')
]
replace_in_file('src/routes/cabine.tsx', replacements_cabine)

print('Success')
