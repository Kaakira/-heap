class RGB {
  r: number;
  g: number;
  b: number;
  lastTime: number = 0;
  duration: number;
  constructor() {
    this.duration = Math.random() * 3000 + 5000;
    let weight = Math.random() / 2;
    this.r = Math.ceil(30 + weight * 30);
    this.g = Math.ceil(180 + weight * 20);
    this.b = Math.ceil(235 + weight * 25);
  }
  ToString(): string {
    let persent = (performance.now() / this.duration) % 2;
    if (persent > 1) {
      persent = 2 - persent;
    }
    let g = Math.ceil(this.g + persent * 30);
    let r = Math.ceil(this.r + persent * 50);
    return `#${r.toString(16)}${g.toString(16)}${this.b.toString(16)}`;
  }
}

export class GlassEffectBoard {
  status: number = 0;
  area: { col: number; row: number } = { col: 4, row: 10 };
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  height: number;
  width: number;
  reqID: number;

  // 三角形信息
  triangles: {
    color: RGB;
    // 三角形标点
    points: {
      x: number;
      y: number;
      duration: number;
      sx: number;
      sy: number;
      moveX: number;
      moveY: number;
    }[];
  }[] = [];

  constructor(param: { id: string; area: { col: number; row: number } }) {

    this.canvas = <HTMLCanvasElement>document.getElementById(param.id);
    this.context = this.canvas.getContext("2d");
    this.area = param.area || this.area;
    this.canvas.height = this.canvas.clientHeight;
    this.canvas.width = this.canvas.clientWidth;
    this.height = this.canvas.height;
    this.width = this.canvas.width;
    // 二维坐标点数组
    let points: {
      x: number;
      y: number;
      sx: number;
      sy: number;
      moveX: number;
      moveY: number;
      // 运动周期持续时间 毫秒单位
      duration: number;
    }[][] = [];
    // 根据二维，“随机”均匀分布各点
    console.log(this.height+"|"+this.width);
    for (let col = 0; col < this.area.col; col++) {
      points[col] = [];
      for (let row = 0; row < this.area.row; row++) {
        let point = {
          x:
            col * (this.width / (this.area.col - 1)) + col * 70 - this.area.col * 55 + Math.random() * this.area.col * 30,
          y:
            row * (this.height / (this.area.row - 1)) +
            row * 70 -
            this.area.row * 55 +
            Math.random() * this.area.row * 30,
          moveX: 0,
          moveY: 0,
          sx: 0,
          sy: 0,
          duration: 3000 + Math.random() * 3000
        };
        point.moveX = Math.random() * 100;
        point.sx = point.x;
        point.sy = point.y;
        points[col].push(point);
      }
    }

    // 初始化三角形
    for (let col = 0; col < this.area.col - 1; col++) {
      for (let row = 0; row < this.area.row - 1; row++) {
        // 每row*col个点，可以生成(row-1)*(col-1)*2个三角形
        this.triangles.push(
          {
            color: new RGB(),
            points: [
              points[col][row],
              points[col + 1][row],
              points[col][row + 1]
            ]
          },
          {
            color: new RGB(),
            points: [
              points[col][row + 1],
              points[col + 1][row],
              points[col + 1][row + 1]
            ]
          }
        );
      }
    }
    this.status = 1;
    this.Update(1);
  }

  Toggle() {
    if (this.status == 1) {
      window.cancelAnimationFrame(this.reqID);
      this.status = 0;
    } else {
      this.status = 1;
      this.Update(performance.now());
    }
  }

  Update(timestamp: number): void {
    if (this.status == 1) {
      // 清空重绘
      this.context.beginPath();
      this.context.fillStyle = "#66ccff";
      this.context.fillRect(0, 0, this.width, this.height);
      // 每row*col个点，可以生成(row-1)*(col-1)*2个三角形
      this.triangles.forEach((triangle, index) => {
        // 绘制三角形
        this.DrawTriangle(triangle);
        this.moveEaseInOut(timestamp, triangle.points);
      });

      this.reqID = window.requestAnimationFrame(this.Update.bind(this));
    }
  }

  DrawTriangle(triangle: { color: RGB; points: { x: number; y: number }[] }) {
    this.context.beginPath();
    this.context.moveTo(triangle.points[0].x, triangle.points[0].y);
    this.context.lineTo(triangle.points[1].x, triangle.points[1].y);
    this.context.lineTo(triangle.points[2].x, triangle.points[2].y);
    this.context.fillStyle = triangle.color.ToString();
    this.context.fill();
  }

  moveEaseInOut(
    time: number,
    abcd: {
      x: number;
      y: number;
      sx: number;
      sy: number;
      duration: number;
      moveX: number;
      moveY: number;
    }[]
  ) {
    for (let point of abcd) {
      // (总时间/持续时间=动画次数) % 2
      let persentComplete = (time / point.duration) % 2;
      // 移动完成百分比
      if (persentComplete < 1) {
        point.x = point.sx + point.moveX * this.makeEaseInOut2(persentComplete);
      } else {
        persentComplete = persentComplete - 1;
        point.x =
          point.sx + point.moveX * this.makeEaseInOut2(1 - persentComplete);
      }
    }
  }

  makeEaseInOut2(percentComplete: number): number {
    if (percentComplete < 0.5) {
      percentComplete *= 2;
      return Math.pow(percentComplete, 2) / 2;
    } else {
      percentComplete = 1 - percentComplete;
      percentComplete *= 2;
      return 1 - Math.pow(percentComplete, 2) / 2;
    }
  }
}
