export type Vec3 = readonly [number, number, number]

export interface CameraPose {
  pos: Vec3
  target: Vec3
  fov: number
}
