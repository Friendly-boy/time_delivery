import tkinter as tk

# 칸 크기와 맵 크기
CELL = 64
COLS, ROWS = 9, 7

START = (1, 3)
SWITCH = (2, 2)
DOOR = (4, 3)
PACKAGE = (6, 3)
GOAL = (7, 3)

WALLS = {
    # 바깥 테두리
    *((x, 0) for x in range(COLS)),
    *((x, ROWS - 1) for x in range(COLS)),
    *((0, y) for y in range(ROWS)),
    *((COLS - 1, y) for y in range(ROWS)),
    # 방을 가로막는 벽. 문 자리만 통과 가능
    (4, 1), (4, 2), (4, 4), (4, 5),
}


class TimeDeliveryGame:
    def __init__(self, root):
        self.root = root
        self.root.title("시간 배달부")

        self.canvas = tk.Canvas(
            root,
            width=COLS * CELL,
            height=ROWS * CELL + 90,
            bg="#17202a",
            highlightthickness=0,
        )
        self.canvas.pack()
        self.canvas.focus_set()

        self.mode = "record"  # record 또는 replay
        self.player = START
        self.path = []
        self.echo = None
        self.echo_index = 0
        self.package_collected = False
        self.won = False

        self.root.bind("<Up>", lambda event: self.move(0, -1))
        self.root.bind("<Down>", lambda event: self.move(0, 1))
        self.root.bind("<Left>", lambda event: self.move(-1, 0))
        self.root.bind("<Right>", lambda event: self.move(1, 0))
        self.root.bind("<w>", lambda event: self.move(0, -1))
        self.root.bind("<s>", lambda event: self.move(0, 1))
        self.root.bind("<a>", lambda event: self.move(-1, 0))
        self.root.bind("<d>", lambda event: self.move(1, 0))
        self.root.bind("<r>", lambda event: self.rewind())
        self.root.bind("<R>", lambda event: self.rewind())

        self.draw()

    def door_is_open(self):
        return self.mode == "replay" and self.echo == SWITCH

    def move(self, dx, dy):
        if self.won:
            return

        next_pos = (self.player[0] + dx, self.player[1] + dy)

        if next_pos in WALLS:
            return
        if next_pos == DOOR and not self.door_is_open():
            return

        self.player = next_pos

        if self.mode == "record":
            self.path.append(self.player)
        else:
            # 플레이어가 한 칸 이동할 때 잔상도 기록된 길을 한 칸 따라갑니다.
            if self.echo_index < len(self.path):
                self.echo = self.path[self.echo_index]
                self.echo_index += 1

        if self.player == PACKAGE:
            self.package_collected = True

        if self.package_collected and self.player == GOAL:
            self.won = True

        self.draw()

    def rewind(self):
        if self.won:
            return

        if self.mode == "record":
            if not self.path:
                self.message = "먼저 스위치까지 걸어가 보세요!"
                self.draw()
                return
            self.mode = "replay"

        # R을 다시 누르면 잔상 퍼즐을 처음부터 재도전합니다.
        self.player = START
        self.echo = None
        self.echo_index = 0
        self.draw()

    def draw(self):
        self.canvas.delete("all")

        # 바닥 칸
        for y in range(ROWS):
            for x in range(COLS):
                self.canvas.create_rectangle(
                    x * CELL,
                    y * CELL,
                    (x + 1) * CELL,
                    (y + 1) * CELL,
                    fill="#263746",
                    outline="#34495e",
                )

        # 벽
        for x, y in WALLS:
            self.canvas.create_rectangle(
                x * CELL, y * CELL,
                (x + 1) * CELL, (y + 1) * CELL,
                fill="#111820",
                outline="#111820",
            )

        # 스위치
        sx, sy = SWITCH
        switch_color = "#f1c40f" if self.echo == SWITCH else "#8e7d32"
        self.canvas.create_oval(
            sx * CELL + 14, sy * CELL + 14,
            (sx + 1) * CELL - 14, (sy + 1) * CELL - 14,
            fill=switch_color, outline="",
        )
        self.canvas.create_text(
            sx * CELL + CELL / 2, sy * CELL + CELL / 2,
            text="스위치", fill="#17202a", font=("Arial", 10, "bold"),
        )

        # 문
        dx, dy = DOOR
        door_color = "#2ecc71" if self.door_is_open() else "#c0392b"
        self.canvas.create_rectangle(
            dx * CELL + 8, dy * CELL + 4,
            (dx + 1) * CELL - 8, (dy + 1) * CELL - 4,
            fill=door_color, outline="",
        )
        self.canvas.create_text(
            dx * CELL + CELL / 2, dy * CELL + CELL / 2,
            text="열림" if self.door_is_open() else "문",
            fill="white", font=("Arial", 11, "bold"),
        )

        # 목표 지점
        gx, gy = GOAL
        self.canvas.create_text(
            gx * CELL + CELL / 2, gy * CELL + CELL / 2,
            text="🏁", font=("Arial", 25),
        )

        # 소포
        if not self.package_collected:
            px, py = PACKAGE
            self.canvas.create_text(
                px * CELL + CELL / 2, py * CELL + CELL / 2,
                text="📦", font=("Arial", 27),
            )

        # 잔상
        if self.echo is not None:
            ex, ey = self.echo
            self.canvas.create_oval(
                ex * CELL + 13, ey * CELL + 13,
                (ex + 1) * CELL - 13, (ey + 1) * CELL - 13,
                fill="#5dade2", outline="white", width=2,
            )
            self.canvas.create_text(
                ex * CELL + CELL / 2, ey * CELL + CELL / 2,
                text="잔상", fill="white", font=("Arial", 10, "bold"),
            )

        # 플레이어
        x, y = self.player
        self.canvas.create_oval(
            x * CELL + 10, y * CELL + 10,
            (x + 1) * CELL - 10, (y + 1) * CELL - 10,
            fill="#f5f5f5", outline="#3498db", width=4,
        )
        self.canvas.create_text(
            x * CELL + CELL / 2, y * CELL + CELL / 2,
            text="나", fill="#17202a", font=("Arial", 12, "bold"),
        )

        # 안내 문구
        if self.won:
            status = "배달 성공! 🎉  다시 하려면 R을 누르세요."
        elif self.mode == "record":
            status = "기록 중: 스위치까지 걸어간 뒤 R을 눌러 시간을 되감으세요."
        else:
            status = "잔상 재생 중: 소포를 집어 🏁까지 배달하세요.  R: 재시작"

        self.canvas.create_rectangle(
            0, ROWS * CELL, COLS * CELL, ROWS * CELL + 90,
            fill="#17202a", outline="",
        )
        self.canvas.create_text(
            16, ROWS * CELL + 25,
            anchor="w", text=status, fill="white",
            font=("Arial", 12),
        )
        self.canvas.create_text(
            16, ROWS * CELL + 56,
            anchor="w", text="이동: 방향키 또는 WASD    되감기/재시작: R",
            fill="#bdc3c7", font=("Arial", 11),
        )


if __name__ == "__main__":
    root = tk.Tk()
    game = TimeDeliveryGame(root)
    root.mainloop()
