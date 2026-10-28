with open('src/components/scada/BoxCard.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('<div className="eyebrow">Volume</div>', '<div className="eyebrow">Volume (LiDAR)</div>')
text = text.replace('<div className="eyebrow">Peso</div>', '<div className="eyebrow">Peso (LiDAR)</div>')

old_html = """        </div>
      </div>

      {mat ? ("""
new_html = """        </div>
        <div className="col-span-2 rounded-md bg-background/60 p-2 border border-blue-500/20">
          <div className="eyebrow text-blue-400">Peso de Entrada (Balança)</div>
          <div className="metric text-base font-semibold text-blue-400">{fmt(box.input_weight_g)} <span className="text-xs opacity-70">g</span></div>
        </div>
      </div>

      {mat ? ("""

text = text.replace(old_html, new_html)

with open('src/components/scada/BoxCard.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
