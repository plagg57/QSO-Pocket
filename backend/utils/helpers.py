import re

VALID_USER_TYPES = ["radioamateur", "cibiste", "swl"]
VALID_LOGBOOKS = ["radioamateur", "cb", "swl"]

# ITU amateur radio callsign format
AMATEUR_CALLSIGN_REGEX = re.compile(r'^([A-Z]{1,2}[0-9]|[0-9][A-Z]{1,2}[0-9])[A-Z]{1,4}(/[A-Z0-9]{1,4})?$')

def validate_amateur_callsign(callsign: str) -> bool:
    cs = callsign.upper().strip().replace(" ", "")
    return bool(AMATEUR_CALLSIGN_REGEX.match(cs))

def logbook_filter(logbook: str) -> dict:
    """Build a MongoDB filter for logbook field, with backward compatibility."""
    if logbook == "radioamateur":
        return {"$or": [{"logbook": "radioamateur"}, {"logbook": {"$exists": False}}]}
    return {"logbook": logbook}

def freq_to_band(freq_mhz):
    if not freq_mhz:
        return None
    f = float(freq_mhz)
    bands = [
        (0.1357, 0.1378, "2200m"), (0.472, 0.479, "630m"),
        (1.8, 2.0, "160m"), (3.5, 3.8, "80m"), (5.3515, 5.3665, "60m"),
        (7.0, 7.2, "40m"), (10.1, 10.15, "30m"), (14.0, 14.35, "20m"),
        (18.068, 18.168, "17m"), (21.0, 21.45, "15m"), (24.89, 24.99, "12m"),
        (26.965, 27.405, "11m"), (28.0, 29.7, "10m"),
        (50.0, 54.0, "6m"), (70.0, 70.5, "4m"), (144.0, 148.0, "2m"),
        (222.0, 225.0, "1.25m"), (430.0, 440.0, "70cm"),
        (902.0, 928.0, "33cm"), (1240.0, 1300.0, "23cm"), (2300.0, 2450.0, "13cm"),
        (5650.0, 5925.0, "5cm"),
    ]
    for lo, hi, name in bands:
        if lo <= f <= hi:
            return name
    return None

def parse_adif(content: str) -> list:
    """Parse ADIF content and return list of QSO dicts."""
    from datetime import datetime, timezone
    eoh_match = re.search(r'<EOH>', content, re.IGNORECASE)
    if eoh_match:
        content = content[eoh_match.end():]

    qsos = []
    records = re.split(r'<EOR>', content, flags=re.IGNORECASE)

    for record in records:
        record = record.strip()
        if not record:
            continue
        fields = {}
        for match in re.finditer(r'<(\w+):(\d+)(?::\w+)?>(.*?)(?=<\w+:|\Z)', record, re.DOTALL | re.IGNORECASE):
            name = match.group(1).upper()
            length = int(match.group(2))
            value = match.group(3)[:length].strip()
            fields[name] = value

        if not fields.get("CALL"):
            continue

        date_str = fields.get("QSO_DATE", "")
        if len(date_str) == 8:
            date_str = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"
        elif not date_str:
            date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        time_str = fields.get("TIME_ON", "")
        if len(time_str) >= 4:
            time_str = f"{time_str[:2]}:{time_str[2:4]}"

        freq = 0.0
        try:
            freq = float(fields.get("FREQ", "0"))
        except ValueError:
            pass

        qsos.append({
            "callsign": fields.get("CALL", "").upper(),
            "date": date_str,
            "time_utc": time_str,
            "frequency": freq,
            "mode": fields.get("MODE", ""),
            "name": fields.get("NAME", ""),
            "comment": fields.get("COMMENT", fields.get("NOTES", "")),
            "qsl_sent": fields.get("QSL_SENT", "") == "Y",
            "qsl_received": fields.get("QSL_RCVD", "") == "Y",
            "rst_sent": fields.get("RST_SENT", ""),
            "rst_received": fields.get("RST_RCVD", ""),
        })

    return qsos

def qso_to_adif_string(qso: dict, my_callsign: str) -> str:
    def af(name, value):
        if not value: return ""
        v = str(value)
        return f"<{name}:{len(v)}>{v}"

    s = ""
    s += af("CALL", qso.get("callsign", ""))
    raw_date = qso.get("date", "")
    if raw_date:
        s += af("QSO_DATE", raw_date.replace("-", ""))
    time_utc = qso.get("time_utc", "")
    if time_utc:
        s += af("TIME_ON", time_utc.replace(":", ""))
    freq = qso.get("frequency")
    if freq:
        s += af("FREQ", f"{freq:.6f}")
    band = freq_to_band(freq) if freq else None
    if band:
        s += af("BAND", band)
    mode = qso.get("mode", "")
    if mode:
        s += af("MODE", mode)
    name = qso.get("name", "")
    if name:
        s += af("NAME", name)
    comment = qso.get("comment", "")
    if comment:
        s += af("COMMENT", comment)
    s += af("MY_CALLSIGN", my_callsign)
    s += "<EOR>"
    return s
