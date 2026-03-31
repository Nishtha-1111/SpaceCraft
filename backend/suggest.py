def get_center(bbox):
    x1, y1, x2, y2 = bbox
    return ((x1 + x2) / 2, (y1 + y2) / 2)


def get_area(bbox):
    x1, y1, x2, y2 = bbox
    return max(0, x2 - x1) * max(0, y2 - y1)


def is_near(obj1, obj2, threshold=180):
    c1 = get_center(obj1["bbox"])
    c2 = get_center(obj2["bbox"])
    distance = ((c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2) ** 0.5
    return distance < threshold


def is_near_wall(obj, image_width=1000, image_height=1000, margin=120):
    x1, y1, x2, y2 = obj["bbox"]
    return (
        x1 < margin
        or y1 < margin
        or x2 > image_width - margin
        or y2 > image_height - margin
    )


def is_in_center(obj, image_width=1000, image_height=1000):
    cx, cy = get_center(obj["bbox"])
    return (
        image_width * 0.3 <= cx <= image_width * 0.7
        and image_height * 0.3 <= cy <= image_height * 0.7
    )


def analyze_room(detections):
    suggestions = []
    score = 50

    beds = [d for d in detections if d["label"] == "Bed"]
    chairs = [d for d in detections if d["label"] == "Chair"]
    tables = [d for d in detections if d["label"] in ["Table", "Dining Table"]]
    sofas = [d for d in detections if d["label"] == "Sofa"]
    lamps = [d for d in detections if d["label"] == "Lamp"]
    doors = [d for d in detections if d["label"] == "Door"]
    windows = [d for d in detections if d["label"] == "Window"]
    curtains = [d for d in detections if d["label"] == "Curtains"]
    storage_items = [
        d
        for d in detections
        if d["label"] in ["Shelf", "Cabinet", "Cupboard", "Closet", "Sideboard"]
    ]
    carpets = [d for d in detections if d["label"] == "Carpet"]
    nightstands = [d for d in detections if d["label"] == "Nightstand"]

    if beds:
        suggestions.append(
            "Keep enough free space around the bed for easy movement and cleaning."
        )
        score += 8

        for bed in beds:
            if is_in_center(bed):
                suggestions.append(
                    "The bed appears close to the center area. Shifting it nearer to a wall can improve open movement space."
                )
                score -= 6

    if beds and nightstands:
        suggestions.append(
            "A nightstand near the bed improves accessibility and bedroom usability."
        )
        score += 6

    if beds and curtains:
        suggestions.append(
            "Use curtains to control light near the bed area for better comfort and privacy."
        )
        score += 6

    if beds and windows:
        near_found = False
        for bed in beds:
            for window in windows:
                if is_near(bed, window):
                    suggestions.append(
                        "The bed is near natural light, which can improve ventilation and brightness."
                    )
                    score += 6
                    near_found = True
                    break
            if near_found:
                break

        if not near_found:
            suggestions.append(
                "Consider placing the bed closer to natural light if it does not reduce comfort."
            )
            score -= 2

    if chairs and tables:
        near_found = False
        for chair in chairs:
            for table in tables:
                if is_near(chair, table):
                    suggestions.append(
                        "The chair and table are placed conveniently for practical use."
                    )
                    score += 8
                    near_found = True
                    break
            if near_found:
                break

        if not near_found:
            suggestions.append(
                "Place the chair closer to the table for better usability and cleaner layout."
            )
            score -= 4

    if sofas:
        for sofa in sofas:
            if is_in_center(sofa):
                suggestions.append(
                    "The sofa occupies central space. Moving it closer to a wall may improve circulation."
                )
                score -= 5

    if doors and (beds or sofas or tables):
        blocked = False
        large_items = beds + sofas + tables
        for item in large_items:
            for door in doors:
                if is_near(item, door, threshold=150):
                    suggestions.append(
                        "Large furniture appears close to the door. Keep the entry path more open."
                    )
                    score -= 8
                    blocked = True
                    break
            if blocked:
                break

    if storage_items:
        wall_ok = False
        for item in storage_items:
            if is_near_wall(item):
                wall_ok = True
                break

        if wall_ok:
            suggestions.append(
                "Storage furniture is placed efficiently near the edges, which helps preserve usable floor space."
            )
            score += 6
        else:
            suggestions.append(
                "Move storage furniture closer to walls to free the center of the room."
            )
            score -= 4

    if lamps:
        suggestions.append(
            "Keep the lamp near a reading, study, or seating area for better task lighting."
        )
        score += 4

    if carpets:
        suggestions.append(
            "Use the carpet to define the main functional area while keeping surrounding movement paths clear."
        )
        score += 3

    center_objects = [d for d in detections if is_in_center(d)]
    if len(center_objects) >= 3:
        suggestions.append(
            "The middle of the room appears visually crowded. Keep the central zone more open for smoother movement."
        )
        score -= 8

    if len(detections) >= 7:
        suggestions.append(
            "This room contains many visible objects. Reducing clutter or grouping related furniture can improve visual balance."
        )
        score -= 5

    if not suggestions:
        suggestions.append(
            "The layout looks acceptable, but more detected furniture would allow smarter suggestions."
        )

    score = max(0, min(100, score))

    return {"score": score, "suggestions": suggestions}