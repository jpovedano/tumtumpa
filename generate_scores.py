import os

def create_musicxml(filename, title, tempo_bpm, measures_xml):
    header = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work>
    <work-title>{title}</work-title>
  </work>
  <identification>
    <creator type="composer">Drum Practice Trainer</creator>
  </identification>
  <part-list>
    <score-part id="P1">
      <part-name>Drumset</part-name>
      <score-instrument id="P1-I36"><instrument-name>Bass Drum 1</instrument-name></score-instrument>
      <score-instrument id="P1-I38"><instrument-name>Acoustic Snare</instrument-name></score-instrument>
      <score-instrument id="P1-I42"><instrument-name>Closed Hi-Hat</instrument-name></score-instrument>
      <score-instrument id="P1-I46"><instrument-name>Open Hi-Hat</instrument-name></score-instrument>
      <score-instrument id="P1-I49"><instrument-name>Crash Cymbal 1</instrument-name></score-instrument>
      <score-instrument id="P1-I51"><instrument-name>Ride Cymbal 1</instrument-name></score-instrument>
      <score-instrument id="P1-I48"><instrument-name>High Tom</instrument-name></score-instrument>
      <score-instrument id="P1-I45"><instrument-name>Mid Tom</instrument-name></score-instrument>
      <score-instrument id="P1-I41"><instrument-name>Floor Tom</instrument-name></score-instrument>
      <midi-device id="P1-D1" port="1"></midi-device>
      <midi-instrument id="P1-I36"><midi-channel>10</midi-channel><midi-program>1</midi-program><midi-unpitched>36</midi-unpitched></midi-instrument>
      <midi-instrument id="P1-I38"><midi-channel>10</midi-channel><midi-program>1</midi-program><midi-unpitched>38</midi-unpitched></midi-instrument>
      <midi-instrument id="P1-I42"><midi-channel>10</midi-channel><midi-program>1</midi-program><midi-unpitched>42</midi-unpitched></midi-instrument>
      <midi-instrument id="P1-I46"><midi-channel>10</midi-channel><midi-program>1</midi-program><midi-unpitched>46</midi-unpitched></midi-instrument>
      <midi-instrument id="P1-I49"><midi-channel>10</midi-channel><midi-program>1</midi-program><midi-unpitched>49</midi-unpitched></midi-instrument>
      <midi-instrument id="P1-I51"><midi-channel>10</midi-channel><midi-program>1</midi-program><midi-unpitched>51</midi-unpitched></midi-instrument>
      <midi-instrument id="P1-I48"><midi-channel>10</midi-channel><midi-program>1</midi-program><midi-unpitched>50</midi-unpitched></midi-instrument>
      <midi-instrument id="P1-I45"><midi-channel>10</midi-channel><midi-program>1</midi-program><midi-unpitched>47</midi-unpitched></midi-instrument>
      <midi-instrument id="P1-I41"><midi-channel>10</midi-channel><midi-program>1</midi-program><midi-unpitched>41</midi-unpitched></midi-instrument>
    </score-part>
  </part-list>
  <part id="P1">
"""
    footer = """  </part>
</score-partwise>
"""
    with open(filename, "w", encoding="utf-8") as f:
        f.write(header + measures_xml + footer)
    print(f"Generated {filename}")

# Instrument helper functions
def note_xml(inst_id, step, octave, duration, note_type, voice=1, chord=False, notehead="normal", stem="up", beam=None, parentheses=False):
    chord_tag = "<chord/>\n      " if chord else ""
    paren_attr = ' parentheses="yes"' if parentheses else ""
    notehead_tag = f"<notehead{paren_attr}>{notehead}</notehead>\n      " if notehead else ""
    beam_tag = f"<beam number=\"1\">{beam}</beam>\n      " if beam else ""
    return f"""    <note>
      {chord_tag}<unpitched>
        <display-step>{step}</display-step>
        <display-octave>{octave}</display-octave>
      </unpitched>
      <duration>{duration}</duration>
      <instrument id="{inst_id}"/>
      <voice>{voice}</voice>
      <type>{note_type}</type>
      <stem>{stem}</stem>
      {notehead_tag}{beam_tag}</note>
"""

def generate_standard_rock_measures(num_measures=4):
    xml = ""
    for m in range(1, num_measures + 1):
        attr = ""
        if m == 1:
            attr = """      <attributes>
        <divisions>2</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>percussion</sign><line>2</line></clef>
      </attributes>
      <direction placement="above">
        <direction-type>
          <metronome><beat-unit>quarter</beat-unit><per-minute>110</per-minute></metronome>
        </direction-type>
        <sound tempo="110"/>
      </direction>
"""
        measure_content = f"""    <measure number="{m}">
{attr}"""
        # 8 eighth notes:
        # 1: HiHat + Kick
        # &: HiHat
        # 2: HiHat + Snare
        # &: HiHat
        # 3: HiHat + Kick
        # &: HiHat
        # 4: HiHat + Snare
        # &: HiHat
        beats = [
            ("P1-I36", "F", 4, True),   # 1 Kick
            (None, "", 0, False),       # &
            ("P1-I38", "C", 5, True),   # 2 Snare
            (None, "", 0, False),       # &
            ("P1-I36", "F", 4, True),   # 3 Kick
            (None, "", 0, False),       # &
            ("P1-I38", "C", 5, True),   # 4 Snare
            (None, "", 0, False),       # &
        ]
        
        # Crash on measure 1 beat 1 instead of hi-hat
        for idx, (drum_id, drum_step, drum_oct, has_drum) in enumerate(beats):
            beam_state = "begin" if (idx % 2 == 0) else "end"
            
            # Cymbal
            cym_id = "P1-I49" if (m == 1 and idx == 0) else "P1-I42"
            cym_step = "A" if (m == 1 and idx == 0) else "G"
            cym_oct = 5
            
            measure_content += note_xml(cym_id, cym_step, cym_oct, 1, "eighth", voice=1, chord=False, notehead="x", stem="up", beam=beam_state)
            if has_drum:
                measure_content += note_xml(drum_id, drum_step, drum_oct, 1, "eighth", voice=1, chord=True, notehead="normal", stem="up")
                
        measure_content += "    </measure>\n"
        xml += measure_content
    return xml

def generate_four_on_floor(num_measures=4):
    xml = ""
    for m in range(1, num_measures + 1):
        attr = ""
        if m == 1:
            attr = """      <attributes>
        <divisions>2</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>percussion</sign><line>2</line></clef>
      </attributes>
      <direction placement="above">
        <direction-type>
          <metronome><beat-unit>quarter</beat-unit><per-minute>124</per-minute></metronome>
        </direction-type>
        <sound tempo="124"/>
      </direction>
"""
        measure_content = f"""    <measure number="{m}">
{attr}"""
        # 4 on the floor: Kick on 1, 2, 3, 4; Snare on 2, 4; Offbeat open hi-hat on &
        for idx in range(8):
            is_downbeat = (idx % 2 == 0)
            beat_num = (idx // 2) + 1
            beam_state = "begin" if is_downbeat else "end"
            
            if is_downbeat:
                # Closed Hi-Hat + Kick (+ Snare on 2 & 4)
                measure_content += note_xml("P1-I42", "G", 5, 1, "eighth", voice=1, chord=False, notehead="x", stem="up", beam=beam_state)
                measure_content += note_xml("P1-I36", "F", 4, 1, "eighth", voice=1, chord=True, notehead="normal", stem="up")
                if beat_num in (2, 4):
                    measure_content += note_xml("P1-I38", "C", 5, 1, "eighth", voice=1, chord=True, notehead="normal", stem="up")
            else:
                # Open Hi-Hat on upbeat
                measure_content += note_xml("P1-I46", "G", 5, 1, "eighth", voice=1, chord=False, notehead="circle-x", stem="up", beam=beam_state)
                
        measure_content += "    </measure>\n"
        xml += measure_content
    return xml

def generate_paradiddle_exercise(num_measures=4):
    # Paradiddle: R L R R   L R L L (16th notes)
    xml = ""
    for m in range(1, num_measures + 1):
        attr = ""
        if m == 1:
            attr = """      <attributes>
        <divisions>4</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>percussion</sign><line>2</line></clef>
      </attributes>
      <direction placement="above">
        <direction-type>
          <metronome><beat-unit>quarter</beat-unit><per-minute>95</per-minute></metronome>
        </direction-type>
        <sound tempo="95"/>
      </direction>
"""
        measure_content = f"""    <measure number="{m}">
{attr}"""
        # Pattern: R L R R  L R L L  R L R R  L R L L
        # 16 sixteenth notes per bar
        # Accent first note of each group with Kick
        pattern = [
            ("R", True), ("L", False), ("R", False), ("R", False),
            ("L", False), ("R", False), ("L", False), ("L", False),
            ("R", True), ("L", False), ("R", False), ("R", False),
            ("L", False), ("R", False), ("L", False), ("L", False),
        ]
        
        for idx, (hand, has_kick) in enumerate(pattern):
            beam_pos = idx % 4
            beam_tag = ""
            if beam_pos == 0:
                beam_tag = '<beam number="1">begin</beam><beam number="2">begin</beam>'
            elif beam_pos == 3:
                beam_tag = '<beam number="1">end</beam><beam number="2">end</beam>'
            else:
                beam_tag = '<beam number="1">continue</beam><beam number="2">continue</beam>'
                
            inst_id = "P1-I38" # Snare
            step = "C"
            octave = 5
            
            note_xml_str = f"""    <note>
      <unpitched>
        <display-step>{step}</display-step>
        <display-octave>{octave}</display-octave>
      </unpitched>
      <duration>1</duration>
      <instrument id="{inst_id}"/>
      <voice>1</voice>
      <type>16th</type>
      <stem>up</stem>
      <notehead>normal</notehead>
      {beam_tag}
    </note>
"""
            measure_content += note_xml_str
            if has_kick:
                measure_content += f"""    <note>
      <chord/>
      <unpitched>
        <display-step>F</display-step>
        <display-octave>4</display-octave>
      </unpitched>
      <duration>1</duration>
      <instrument id="P1-I36"/>
      <voice>1</voice>
      <type>16th</type>
      <stem>up</stem>
      <notehead>normal</notehead>
    </note>
"""
        measure_content += "    </measure>\n"
        xml += measure_content
    return xml

def generate_funky_groove(num_measures=4):
    xml = ""
    for m in range(1, num_measures + 1):
        attr = ""
        if m == 1:
            attr = """      <attributes>
        <divisions>4</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>percussion</sign><line>2</line></clef>
      </attributes>
      <direction placement="above">
        <direction-type>
          <metronome><beat-unit>quarter</beat-unit><per-minute>102</per-minute></metronome>
        </direction-type>
        <sound tempo="102"/>
      </direction>
"""
        measure_content = f"""    <measure number="{m}">
{attr}"""
        # Funky 16th groove with syncopated kick and snare on 2 and 4
        for i in range(16):
            beam_pos = i % 4
            beam_tag = ""
            if beam_pos == 0:
                beam_tag = '<beam number="1">begin</beam><beam number="2">begin</beam>'
            elif beam_pos == 3:
                beam_tag = '<beam number="1">end</beam><beam number="2">end</beam>'
            else:
                beam_tag = '<beam number="1">continue</beam><beam number="2">continue</beam>'
                
            # Hi-hat on all 16ths
            measure_content += f"""    <note>
      <unpitched><display-step>G</display-step><display-octave>5</display-octave></unpitched>
      <duration>1</duration>
      <instrument id="P1-I42"/>
      <voice>1</voice>
      <type>16th</type>
      <stem>up</stem>
      <notehead>x</notehead>
      {beam_tag}
    </note>
"""
            # Drums
            if i in [0, 2, 7, 8, 10]: # Kick
                measure_content += f"""    <note>
      <chord/>
      <unpitched><display-step>F</display-step><display-octave>4</display-octave></unpitched>
      <duration>1</duration>
      <instrument id="P1-I36"/>
      <voice>1</voice>
      <type>16th</type>
      <stem>up</stem>
      <notehead>normal</notehead>
    </note>
"""
            if i in [4, 12]: # Snare backbeat
                measure_content += f"""    <note>
      <chord/>
      <unpitched><display-step>C</display-step><display-octave>5</display-octave></unpitched>
      <duration>1</duration>
      <instrument id="P1-I38"/>
      <voice>1</voice>
      <type>16th</type>
      <stem>up</stem>
      <notehead>normal</notehead>
    </note>
"""
            elif i == 14: # Ghost snare
                measure_content += f"""    <note>
      <chord/>
      <unpitched><display-step>C</display-step><display-octave>5</display-octave></unpitched>
      <duration>1</duration>
      <instrument id="P1-I38"/>
      <voice>1</voice>
      <type>16th</type>
      <stem>up</stem>
      <notehead parentheses="yes">normal</notehead>
    </note>
"""
        measure_content += "    </measure>\n"
        xml += measure_content
    return xml

out_dir = r"C:\Users\javier\Desktop\drum-trainer\scores"
os.makedirs(out_dir, exist_ok=True)

create_musicxml(os.path.join(out_dir, "basic-rock-beat.musicxml"), "Basic 4/4 Rock Beat", 110, generate_standard_rock_measures(4))
create_musicxml(os.path.join(out_dir, "four-on-the-floor.musicxml"), "Four-on-the-Floor Disco Groove", 124, generate_four_on_floor(4))
create_musicxml(os.path.join(out_dir, "paradiddle-exercise.musicxml"), "Paradiddle Rudiment (RLRR LRLL)", 95, generate_paradiddle_exercise(4))
create_musicxml(os.path.join(out_dir, "funky-syncopation.musicxml"), "Syncopated Funk Groove", 102, generate_funky_groove(4))
print("All MusicXML scores generated successfully!")
