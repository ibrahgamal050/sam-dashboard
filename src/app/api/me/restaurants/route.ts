import { NextResponse } from "next/server"
import mongoose from "mongoose"
import { getServerSession } from "next-auth"

import Restaurant from "@/models/Restaurant"
import { authOptions } from "@/server/auth/nextauth-options"

const GLOBAL_KEY = "__global__"

const connectDB = async () => {
  if (mongoose.connections[0]?.readyState) return
  await mongoose.connect(process.env.MONGODB_URI as string)
}

type RoleAssignment = {
  restaurantId: string | null
  role: string
}

const normalizeAssignments = (input: unknown): RoleAssignment[] => {
  if (!Array.isArray(input)) return []
  const map = new Map<string, RoleAssignment>()
  for (const entry of input) {
    if (!entry || typeof entry !== "object") continue
    const role = (entry as any).role
    if (!role) continue
    const restaurantId = (entry as any).restaurantId ?? null
    const key = restaurantId ?? GLOBAL_KEY
    map.set(key, { restaurantId, role })
  }
  return Array.from(map.values())
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const assignments = normalizeAssignments((session.user as any).roleAssignments)
    if (!assignments.length) {
      return NextResponse.json({ restaurants: [] }, { status: 200 })
    }

    await connectDB()

    const hasGlobal = assignments.some((assignment) => assignment.restaurantId == null)
    let restaurants
    if (hasGlobal) {
      restaurants = await Restaurant.find({}).lean()
    } else {
      const ids = assignments
        .map((assignment) => assignment.restaurantId)
        .filter((id): id is string => Boolean(id))
        .map((id) => new mongoose.Types.ObjectId(id))
      if (!ids.length) {
        return NextResponse.json({ restaurants: [] }, { status: 200 })
      }
      restaurants = await Restaurant.find({ _id: { $in: ids } }).lean()
    }

    const assignmentMap = new Map<string, string>()
    assignments.forEach((assignment) => {
      assignmentMap.set(assignment.restaurantId ?? GLOBAL_KEY, assignment.role)
    })
    const fallbackRole = assignmentMap.get(GLOBAL_KEY) ?? null

    const payload = restaurants.map((restaurant: any) => {
      const key = restaurant._id?.toString()
      const role = (key && assignmentMap.get(key)) || fallbackRole || null
      return {
        _id: key,
        name: restaurant.name,
        subdomain: restaurant.subdomain,
        logo: restaurant.logo,
        coverImage: restaurant.coverImage,
        description: restaurant.description,
        isPublished: restaurant.isPublished,
        phones: restaurant.phones ?? [],
        updatedAt: restaurant.updatedAt ?? restaurant.createdAt ?? null,
        role,
      }
    })

    return NextResponse.json({ restaurants: payload }, { status: 200 })
  } catch (error) {
    console.error("Failed to load user restaurants", error)
    return NextResponse.json({ error: "Failed to load restaurants" }, { status: 500 })
  }
}
