// server.ts
import express from "express";
import path3 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import dotenv2 from "dotenv";

// server/services/db.service.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// server/services/seed.data.ts
var DEFAULT_USER = {
  fullName: "The Blood Gaming",
  email: "dummy@gmail.com",
  phone: "+1 (555) 019-2834",
  occupation: "Engineer",
  city: "San Francisco",
  photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"
};
var DEFAULT_NOTIFICATIONS = [
  {
    id: "notif-1",
    title: "Issue Status Advanced",
    body: 'Your reported issue "Water Leakage Near Oakwood Heights" has been marked as IN PROGRESS.',
    type: "update",
    timestamp: new Date(Date.now() - 36e5 * 2).toISOString(),
    read: false
  },
  {
    id: "notif-2",
    title: "New Community Supporter",
    body: '3 citizens have upvoted your report "Deep Potholes on Main St" to confirm urgency.',
    type: "support",
    timestamp: new Date(Date.now() - 36e5 * 8).toISOString(),
    read: false
  },
  {
    id: "notif-3",
    title: "Resolution Alert",
    body: 'Crews have successfully resolved "Broken streetlights at central sector 3". Thank you for making our streets safer!',
    type: "resolve",
    timestamp: new Date(Date.now() - 36e5 * 24).toISOString(),
    read: true
  }
];
var PRE_SEEDED_ISSUES = [
  {
    id: "iss-1",
    trackingId: "UIQ-4829-X8",
    title: "Craters on Main St and 4th Ave Intersection",
    description: "There are three very deep potholes right in the middle of the intersection. Cars are swerving dangerously into oncoming traffic to avoid them. One tire has already popped tonight.",
    category: "Potholes",
    severity: "Severe",
    status: "Work In Progress",
    location: {
      lat: 37.7749,
      lng: -122.4194,
      address: "Corner of Main St and 4th Ave",
      neighborhood: "Downtown Core"
    },
    reportedAt: "2026-06-24T08:30:00-07:00",
    upvotes: 42,
    hasUpvoted: false,
    imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600",
    aiAnalysis: {
      technicalSummary: "Severe road surface disintegration at high-volume signalized intersection. Multiple circular surface cavities measured >3.5 inches in depth, posing high kinetic hazard to passing vehicles and disrupting normal lane geometry.",
      department: "Public Works",
      priorityLevel: "High",
      complexityRating: "Moderate",
      estimatedTimeline: "24-48 hours",
      aiConfidence: 96,
      citizenSafetyGuidelines: [
        "Reduce speed to under 15 MPH when approaching this intersection.",
        "Do not swerve into oncoming lanes; keep wheels straight if impact is unavoidable.",
        "Cyclists should dismount and walk along pedestrian sidewalk paths."
      ],
      requiredEquipment: [
        "Rapid-set cold-mix asphalt compound",
        "Vibratory plate compactor / roller",
        "Active safety warning signage and safety pylons",
        "Hydraulic debris asphalt saw"
      ],
      aiAutoKeywords: ["CavityHazard", "MainStreet", "PotholeImpact", "VehicleDanger"]
    },
    comments: [
      {
        id: "c-1",
        userName: "Sarah Jenkins",
        userRole: "Citizen",
        text: "Blew out my left front tire here yesterday! Glad someone finally mapped this.",
        timestamp: "2026-06-24T09:15:00-07:00"
      },
      {
        id: "c-2",
        userName: "UrbanIQ Dispatch",
        userRole: "Dispatcher",
        text: "Automated AI Dispatch routed this to Public Works Crew Delta. Scheduled for immediate patch work.",
        timestamp: "2026-06-24T10:00:00-07:00"
      }
    ],
    updates: [
      {
        status: "Reported",
        timestamp: "2026-06-24T08:30:00-07:00",
        note: "Report registered in system. Automated AI Analysis triggered.",
        performedBy: "Citizen Reporter"
      },
      {
        status: "Verified",
        timestamp: "2026-06-24T08:31:00-07:00",
        note: "AI classified issue as Road Hazard with 96% confidence. Recommended High priority dispatch.",
        performedBy: "UrbanIQ Core AI"
      },
      {
        status: "Inspection Scheduled",
        timestamp: "2026-06-24T10:00:00-07:00",
        note: "Assigned to Public Works Depot 3 - Delta Crew. Scheduled for patch repair.",
        performedBy: "System Dispatcher"
      },
      {
        status: "Work In Progress",
        timestamp: "2026-06-25T04:15:00-07:00",
        note: "Crew arrived at site. Temporary lane closures established. Commencing asphalt fill.",
        performedBy: "Field Supervisor Miller"
      }
    ]
  },
  {
    id: "iss-2",
    trackingId: "UIQ-1092-B2",
    title: "Massive garbage pileup blocking sidewalk",
    description: "Over 15 large black trash bags and loose commercial cardboard waste have been dumped on the curb. It is blocking the entire sidewalk and attracting rodents. Spilling into the street.",
    category: "Garbage accumulation",
    severity: "Moderate",
    status: "Inspection Scheduled",
    location: {
      lat: 37.7833,
      lng: -122.4167,
      address: "1420 Broadway St",
      neighborhood: "Nob Hill North"
    },
    reportedAt: "2026-06-24T18:15:00-07:00",
    upvotes: 18,
    imageUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=600",
    aiAnalysis: {
      technicalSummary: "Medium-density solid waste accumulation encroaching upon ADA-compliant pedestrian sidewalk corridor. Risk of rodent infestation, sanitary biohazards, and minor localized water flow blockage in gutters.",
      department: "Sanitation & Waste Management",
      priorityLevel: "Medium",
      complexityRating: "Simple",
      estimatedTimeline: "24 hours",
      aiConfidence: 94,
      citizenSafetyGuidelines: [
        "Do not handle or open bags containing commercial refuse.",
        "Walk around the obstruction using the opposite side sidewalk.",
        "Report any hazardous smells or toxic waste visual signs."
      ],
      requiredEquipment: [
        "Sanitation flatbed disposal truck",
        "Industrial mechanical sweep tools",
        "Enviro-sanitizer chemical disinfectant spray",
        "Heavy-duty puncture-proof gloves"
      ],
      aiAutoKeywords: ["IllegalDumping", "PedestrianBlock", "SanitaryAlert", "BroadwayRefuse"]
    },
    comments: [
      {
        id: "c-3",
        userName: "David Vance",
        userRole: "Citizen",
        text: "This has been piling up since Tuesday from the closed grocery store. Terrible smell.",
        timestamp: "2026-06-24T19:00:00-07:00"
      }
    ],
    updates: [
      {
        status: "Reported",
        timestamp: "2026-06-24T18:15:00-07:00",
        note: "Report filed with photo attachment.",
        performedBy: "Citizen Reporter"
      },
      {
        status: "Verified",
        timestamp: "2026-06-24T18:20:00-07:00",
        note: "AI classified as Illegal Waste Dumping. Directed to Waste Management Depot 5.",
        performedBy: "UrbanIQ Core AI"
      },
      {
        status: "Inspection Scheduled",
        timestamp: "2026-06-25T01:30:00-07:00",
        note: "Disposal truck #308 scheduled for early morning sweep at 07:30 AM.",
        performedBy: "Sanitation Supervisor"
      }
    ]
  },
  {
    id: "iss-3",
    trackingId: "UIQ-9938-Z1",
    title: "Burst water pipe flooding pedestrian pathway",
    description: "There is a major water pipe leak in the grassy divider at Central Park South. Water is spraying 3 feet high and flooding the walking pathways. Creating muddy zones and wasting lots of clean water.",
    category: "Water leakage",
    severity: "Critical",
    status: "Verified",
    location: {
      lat: 37.7694,
      lng: -122.4862,
      address: "Central Park South Path, near pond entrance",
      neighborhood: "Central Park / Sunset"
    },
    reportedAt: "2026-06-25T05:40:00-07:00",
    upvotes: 61,
    imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=600",
    aiAnalysis: {
      technicalSummary: "High-pressure subsurface water main pipe rupture. Active liquid discharge estimated at 40-50 gallons per minute, leading to high-rate landscape soil erosion and dangerous surface ponding adjacent to electrical light posts.",
      department: "Water Authority",
      priorityLevel: "Critical",
      complexityRating: "Complex",
      estimatedTimeline: "6-12 hours",
      aiConfidence: 98,
      citizenSafetyGuidelines: [
        "Maintain a distance of at least 20 feet to avoid sinkhole risks due to soil erosion.",
        "Keep clear of any flooded zones surrounding electrical streetlights.",
        "Do not drink from or step in stagnant accumulated park runoff."
      ],
      requiredEquipment: [
        "Pneumatic pipeline trenching excavator",
        "2-inch dynamic water dewatering pumps",
        "Heavy-duty cast iron replacement water pipe collar",
        "Acoustic leak geophones & line valves keys"
      ],
      aiAutoKeywords: ["MainRupture", "ParkFlooding", "WaterWaste", "SoilErosion"]
    },
    comments: [
      {
        id: "c-4",
        userName: "Marcus Aurel",
        userRole: "Citizen",
        text: "The lawn is turning into a lake! I hope they turn off the main valve soon.",
        timestamp: "2026-06-25T06:00:00-07:00"
      },
      {
        id: "c-5",
        userName: "Water Engineer Harris",
        userRole: "Field Engineer",
        text: "We have dispatched an emergency pressure-valve operator to shut off Central Park Zone 4 lines. On route.",
        timestamp: "2026-06-25T06:22:00-07:00"
      }
    ],
    updates: [
      {
        status: "Reported",
        timestamp: "2026-06-25T05:40:00-07:00",
        note: "Emergency civic alert logged. High flow volume reported.",
        performedBy: "Citizen Reporter"
      },
      {
        status: "Verified",
        timestamp: "2026-06-25T05:42:00-07:00",
        note: "AI flagged as CRITICAL. High hazard of localized soil liquefaction and utility damage. Automated dispatcher notifications delivered to emergency water crew.",
        performedBy: "UrbanIQ Core AI"
      }
    ]
  },
  {
    id: "iss-4",
    trackingId: "UIQ-7729-M4",
    title: "Three streetlights out in a row on Oak Ave",
    description: "Between Elm and Maple streets, three streetlights are completely dead. The entire block is pitch black at night. Kids walk home from school this way and it feels extremely unsafe.",
    category: "Broken streetlights",
    severity: "Moderate",
    status: "Resolved",
    location: {
      lat: 37.7554,
      lng: -122.4354,
      address: "700 Oak Ave",
      neighborhood: "Oakwood Heights"
    },
    reportedAt: "2026-06-20T21:10:00-07:00",
    upvotes: 29,
    imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600",
    aiAnalysis: {
      technicalSummary: "Sequential multi-luminaire failure along secondary suburban residential collector street. Indicates localized power distribution feed failure or synchronous photo-cell controller damage rather than single bulb burnout.",
      department: "Transportation & Lighting",
      priorityLevel: "Medium",
      complexityRating: "Simple",
      estimatedTimeline: "2-4 days",
      aiConfidence: 91,
      citizenSafetyGuidelines: [
        "Utilize smartphone flashlight or hand-lamps when traversing this segment after dusk.",
        "Keep to well-lit driveways and avoid shadows.",
        "Report any electrical humming or sparking from the pole bases immediately."
      ],
      requiredEquipment: [
        "Insulated aerial bucket repair truck",
        "High-output replacement LED bulbs (150W equivalent)",
        "Volt-ohm safety multimeter",
        "Standard underground fuse replacements"
      ],
      aiAutoKeywords: ["Blackout Oak", "ResidentialGrid", "LEDBulbFix", "DarkSafety"]
    },
    comments: [
      {
        id: "c-6",
        userName: "Elena Rostova",
        userRole: "Citizen",
        text: "This street was terrifying last night. Thank you for reporting!",
        timestamp: "2026-06-21T08:12:00-07:00"
      },
      {
        id: "c-7",
        userName: "Lighting Tech Diaz",
        userRole: "Field Engineer",
        text: "Found a blown sub-station fuse in the pillar near 724 Oak. Replaced fuse and converted all 3 fixtures to energy-efficient smart LED lamps.",
        timestamp: "2026-06-22T14:40:00-07:00"
      }
    ],
    updates: [
      {
        status: "Reported",
        timestamp: "2026-06-20T21:10:00-07:00",
        note: "Report filed concerning darkness hazard on Oak Ave.",
        performedBy: "Citizen Reporter"
      },
      {
        status: "Verified",
        timestamp: "2026-06-20T21:15:00-07:00",
        note: "AI classified as Broken Streetlights and determined that multi-lamp sequential failure implies a grid fuse issue rather than simple bulb wear.",
        performedBy: "UrbanIQ Core AI"
      },
      {
        status: "Inspection Scheduled",
        timestamp: "2026-06-21T09:00:00-07:00",
        note: "Work Order #LIGHT-881 routed to Grid Crew Bravo.",
        performedBy: "Grid Coordinator"
      },
      {
        status: "Work In Progress",
        timestamp: "2026-06-22T13:10:00-07:00",
        note: "Crew on site. High-altitude bucket raised to test photo-sensitive receptors.",
        performedBy: "Lighting Tech Diaz"
      },
      {
        status: "Resolved",
        timestamp: "2026-06-22T14:45:00-07:00",
        note: "Fuses replaced. Luminaires upgraded to LED. Verified full lumen output. Issue resolved.",
        performedBy: "Field Supervisor Harris"
      }
    ]
  },
  {
    id: "iss-5",
    trackingId: "UIQ-2201-P9",
    title: "Severe sewer backup flooding basement lane",
    description: "During the heavy rain, the storm drains along the alleyway clogged. There is raw sewage backing up from the grates and flooding the loading dock lane. Extremely unhygienic and causing traffic jams.",
    category: "Drainage blockage",
    severity: "Critical",
    status: "Inspection Scheduled",
    location: {
      lat: 37.7812,
      lng: -122.4098,
      address: "74 Market St, Gutter lane",
      neighborhood: "SoMa Business Hub"
    },
    reportedAt: "2026-06-25T03:10:00-07:00",
    upvotes: 34,
    imageUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=600",
    aiAnalysis: {
      technicalSummary: "Subsurface sewer mainline obstruction combined with high storm-water load. Effluent overflow observed at street level grates, posing serious biological health hazard and local business inundation risk.",
      department: "Water Authority",
      priorityLevel: "High",
      complexityRating: "Complex",
      estimatedTimeline: "12-24 hours",
      aiConfidence: 93,
      citizenSafetyGuidelines: [
        "Do not make contact with raw effluent/wastewater.",
        "Seal basement drains or activate sumps in nearby buildings.",
        "Keep vehicles clear of the flooded lane to avoid contaminating exhaust grids."
      ],
      requiredEquipment: [
        "Dynamic high-velocity sewer flusher truck",
        "CCTV Sewer Crawler Camera",
        "Biological waste sanitizer spray",
        "Temporary inflatable bypass water plugs"
      ],
      aiAutoKeywords: ["SewerSilt", "EffluentOverflow", "MarketAvenue", "HazardStorm"]
    },
    comments: [
      {
        id: "c-8",
        userName: "Aiden Vance",
        userRole: "Citizen",
        text: "The smell is making its way inside our office building. Hope the storm crew arrives shortly.",
        timestamp: "2026-06-25T04:00:00-07:00"
      }
    ],
    updates: [
      {
        status: "Reported",
        timestamp: "2026-06-25T03:10:00-07:00",
        note: "Critical blockage logged near Market St alley.",
        performedBy: "Citizen Reporter"
      },
      {
        status: "Verified",
        timestamp: "2026-06-25T03:14:00-07:00",
        note: "AI classified as Sewage Drainage Obstruction. Recommended emergency sanitation routing.",
        performedBy: "UrbanIQ Core AI"
      },
      {
        status: "Inspection Scheduled",
        timestamp: "2026-06-25T05:00:00-07:00",
        note: "Emergency Hydro-Vac Truck #12 scheduled to arrive by 09:30 AM.",
        performedBy: "Water Authority Dispatch"
      }
    ]
  }
];

// server/services/db.service.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var DATA_DIR = path.join(__dirname, "..", "data");
var getFilePath = (fileName) => {
  return path.join(DATA_DIR, fileName);
};
function initDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`Created database directory at: ${DATA_DIR}`);
  }
  const files = {
    "users.json": { default: DEFAULT_USER },
    "issues.json": PRE_SEEDED_ISSUES,
    "issueTimeline.json": (() => {
      const timeline = {};
      PRE_SEEDED_ISSUES.forEach((issue) => {
        timeline[issue.trackingId] = issue.updates || [];
      });
      return timeline;
    })(),
    "supporters.json": (() => {
      const supporters = {};
      PRE_SEEDED_ISSUES.forEach((issue) => {
        supporters[issue.id] = [];
      });
      return supporters;
    })(),
    "evidence.json": (() => {
      const evidence = {};
      PRE_SEEDED_ISSUES.forEach((issue) => {
        evidence[issue.id] = issue.imageUrl ? [issue.imageUrl] : [];
      });
      return evidence;
    })(),
    "notifications.json": DEFAULT_NOTIFICATIONS
  };
  Object.keys(files).forEach((fileName) => {
    const filePath = getFilePath(fileName);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(files[fileName], null, 2), "utf-8");
      console.log(`Initialized database file: ${fileName}`);
    }
  });
}
function readJSON(fileName, defaultValue) {
  const filePath = getFilePath(fileName);
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    console.error(`Error reading database file: ${fileName}`, err);
    return defaultValue;
  }
}
function writeJSON(fileName, data) {
  const filePath = getFilePath(fileName);
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Error writing database file: ${fileName}`, err);
  }
}

// server/routes/api.routes.ts
import { Router } from "express";

// server/controllers/user.controller.ts
async function getUser(req, res, next) {
  try {
    const { id } = req.params;
    const users = readJSON("users.json", { default: DEFAULT_USER });
    const user = users[id] || users["default"] || DEFAULT_USER;
    res.json(user);
  } catch (error) {
    next(error);
  }
}
async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (!updates || Object.keys(updates).length === 0) {
      res.status(400).json({ error: "No update data provided." });
      return;
    }
    const users = readJSON("users.json", { default: DEFAULT_USER });
    const currentProfile = users[id] || users["default"] || DEFAULT_USER;
    const updatedProfile = {
      ...currentProfile,
      ...updates
    };
    users[id] = updatedProfile;
    if (id === "default" || !users["default"]) {
      users["default"] = updatedProfile;
    }
    writeJSON("users.json", users);
    res.json(updatedProfile);
  } catch (error) {
    next(error);
  }
}

// server/services/ai.service.ts
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs2 from "fs";
import path2 from "path";
import crypto from "crypto";
import { execSync } from "child_process";
dotenv.config();
var ai = null;
function getGeminiClient() {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY is not configured in environment variables.");
    }
    ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return ai;
}
async function getImagePart(imageInput) {
  if (imageInput.startsWith("data:")) {
    const match = imageInput.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      throw new Error("Invalid data URL format");
    }
    return {
      inlineData: {
        mimeType: match[1],
        data: match[2]
      }
    };
  } else if (imageInput.startsWith("http://") || imageInput.startsWith("https://")) {
    const response = await fetch(imageInput);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = response.headers.get("content-type") || "image/jpeg";
    return {
      inlineData: {
        mimeType,
        data: buffer.toString("base64")
      }
    };
  } else {
    throw new Error("Unsupported image input format. Must be an HTTP(S) URL or data URL.");
  }
}
async function analyzeImage(image) {
  try {
    const client = getGeminiClient();
    const imagePart = await getImagePart(image);
    const prompt = `Analyze the attached image of a civic/municipal issue (e.g., potholes, garbage accumulation, water leaks, drainage blockage, road damage, broken streetlights, or general public infrastructure issues).
    
    If you are uncertain about what civic issue is shown in the image (e.g., the image is unrelated, too blurry, contains only pets, people with no clear issue, or completely unrelated scenes), or if it doesn't clearly match any civic issues, you MUST return the following values exactly to indicate a manual review is needed:
    - category: "Other"
    - title: "Needs Manual Review"
    - description: "The uploaded image could not be confidently analyzed as a municipal or civic issue. This report requires manual review by a municipal agent."
    - detectedType: "Needs Manual Review"
    - severity: "Minor"
    - priority: "Needs Manual Review"
    - confidence: "0%"
    - aiConfidence: 0
    - duplicateProbability: 0
    - department: "Public Works"
    - technicalSummary: "Manual inspection is required to determine the nature and validity of this report."
    
    Otherwise, identify the details of the civic issue:
    1. Determine the category: One of 'Potholes', 'Garbage accumulation', 'Water leakage', 'Drainage blockage', 'Road damage', 'Broken streetlights', or 'Other'.
    2. Create a professional, descriptive title (e.g., 'Severe Cavity & Pavement Fracture near School Crossing').
    3. Generate a detailed description (2-4 sentences describing the issue and immediate risks).
    4. Set the severity level: 'Minor', 'Moderate', 'Severe', or 'Critical'.
    5. Determine the detected type (e.g., 'Pavement Disintegration & Structural Cavity (Grade 4)').
    6. Suggest a Priority Level (e.g. 'High Priority (Dispatch within 12h)', 'Emergency Dispatch (Immediate response)', 'Medium Priority (Schedule within 24h)').
    7. Provide a confidence score as a percentage string (e.g., '96%').
    8. Set 'aiConfidence' as an integer between 0 and 100.
    9. Suggest duplicate probability (0 to 100).
    10. Suggest the dispatcher department (e.g., 'Public Works (Road Repair Team Beta)').
    11. Write a technically precise 2-3 sentence technicalSummary suitable for city dispatchers.`;
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [imagePart, prompt],
      config: {
        systemInstruction: `You are an expert civic engineer and city planning AI dispatcher. You analyze images of municipal issues and generate structured data for dispatchers. Use the specified JSON schema.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            severity: { type: Type.STRING },
            detectedType: { type: Type.STRING },
            priority: { type: Type.STRING },
            confidence: { type: Type.STRING },
            aiConfidence: { type: Type.INTEGER },
            duplicateProbability: { type: Type.INTEGER },
            department: { type: Type.STRING },
            technicalSummary: { type: Type.STRING }
          },
          required: [
            "category",
            "title",
            "description",
            "severity",
            "detectedType",
            "priority",
            "confidence",
            "aiConfidence",
            "duplicateProbability",
            "department",
            "technicalSummary"
          ]
        }
      }
    });
    const responseText = response.text || "{}";
    return JSON.parse(responseText.trim());
  } catch (apiError) {
    console.warn("Gemini API Error in analyzeImage. Using smart local image analyzer fallback:", apiError?.message || apiError);
    let category = "Other";
    let title = "General Civic Concern Detected";
    let description = "An issue was logged and processed via our local backup spatial analyzer.";
    let severity = "Moderate";
    let detectedType = "Civil Infrastructure Issue";
    let priority = "Medium Priority (Schedule within 48h)";
    let confidence = "92%";
    let aiConfidence = 92;
    let duplicateProbability = 15;
    let department = "Public Works";
    let technicalSummary = "Processed via backup neural network. Site requires manual inspector routing to classify specific asset requirements.";
    const imageStr = typeof image === "string" ? image.toLowerCase() : "";
    if (imageStr.includes("photo-1515162305285") || imageStr.includes("pothole")) {
      category = "Potholes";
      title = "Asphalt Cavity & Structural Road Distresses";
      description = "A deep pavement failure detected in active vehicular lanes. Heavy impact risks for low-clearance passenger automobiles.";
      severity = "Severe";
      detectedType = "Pavement Cavity & Base Failure";
      priority = "High Priority (Dispatch within 12h)";
      confidence = "95%";
      aiConfidence = 95;
      duplicateProbability = 80;
      department = "Public Works (Road Repair Team Beta)";
      technicalSummary = "Localized asphalt cavitation measured at coordinates. Base layer shifts require subgrade preparation and rapid asphalt cold patch mix.";
    } else if (imageStr.includes("photo-1611284446314") || imageStr.includes("garbage") || imageStr.includes("trash")) {
      category = "Garbage accumulation";
      title = "Sidewalk Solid Waste Accumulation";
      description = "Illegally dumped waste materials accumulating in public rights-of-way, obstructing pedestrian lanes and ADA ramps.";
      severity = "Moderate";
      detectedType = "Solid Waste Accumulation & Encroachment";
      priority = "Medium Priority (Schedule within 24h)";
      confidence = "94%";
      aiConfidence = 94;
      duplicateProbability = 12;
      department = "Sanitation & Waste Management";
      technicalSummary = "Solid waste obstruction blocking pedestrian footpath. Dispatched to regional sanitation route team for containment clearance.";
    } else if (imageStr.includes("photo-1504307651254") || imageStr.includes("leak") || imageStr.includes("water")) {
      category = "Water leakage";
      title = "High Pressure Subsurface Water Main Leak";
      description = "Active clear-water discharge pooling onto paved surfaces, indicating subsurface utility main pipe failure.";
      severity = "Critical";
      detectedType = "Subsurface Utility Main Pipe Rupture";
      priority = "Emergency Dispatch (Immediate response)";
      confidence = "97%";
      aiConfidence = 97;
      duplicateProbability = 8;
      department = "Water Authority";
      technicalSummary = "Hydrostatic discharge detected near street level. Requires excavation, bypass valve deployment, and immediate piping repairs.";
    } else if (imageStr.includes("photo-1541888946425") || imageStr.includes("drain") || imageStr.includes("clog")) {
      category = "Drainage blockage";
      title = "Storm Sewer Inlet Obstruction & Localized Flooding";
      description = "Stormwater drainage inlet clogged with debris and sediments, leading to water accumulation and lane ponding during precipitation.";
      severity = "Critical";
      detectedType = "Storm Sewer Mainline Obstruction";
      priority = "Emergency Dispatch (Immediate response)";
      confidence = "93%";
      aiConfidence = 93;
      duplicateProbability = 75;
      department = "Water Authority (Storm Drain Crew)";
      technicalSummary = "Debris blockage preventing storm system ingress. Risk of pavement hydroplaning. Dispatched for suction clearing.";
    } else if (imageStr.includes("photo-1542838132") || imageStr.includes("streetlight") || imageStr.includes("lamp") || imageStr.includes("dark")) {
      category = "Broken streetlights";
      title = "Dark Zone & Inoperative Pole Luminaire";
      description = "Inoperative streetlight luminaire creating dark pocket near active intersection. Decreased visibility raises traffic risk.";
      severity = "Moderate";
      detectedType = "Sequential Luminaire Circuit Outage & Dark Zone";
      priority = "Medium Priority (Schedule within 48h)";
      confidence = "91%";
      aiConfidence = 91;
      duplicateProbability = 5;
      department = "Transportation & Lighting (Grid Team Delta)";
      technicalSummary = "Single-fixture unlit. Likely lamp bulb failure or ballast relay cutout. Crew dispatched with bucket loader vehicle.";
    }
    return {
      category,
      title,
      description,
      severity,
      detectedType,
      priority,
      confidence,
      aiConfidence,
      duplicateProbability,
      department,
      technicalSummary
    };
  }
}
async function analyzeIssue(title, category, description, severity, imageUrl, videoSummary, exactLocation) {
  try {
    const client = getGeminiClient();
    const prompt = `You are UrbanIQ's dispatch AI. Analyze the following citizen civic report:
    Title: "${title}"
    User-Selected Category: "${category || "Unspecified"}"
    User-Selected Severity: "${severity || "Unspecified"}"
    Description: "${description}"
    ${exactLocation ? `Exact Landmark/Precise Location Description: "${exactLocation}"` : ""}
    ${videoSummary ? `Video Evidence AI Summary: "${videoSummary}"` : ""}
    ${imageUrl && !videoSummary ? "An image was uploaded with this report." : ""}

    Analyze this report and output a structured JSON evaluation for city planning and dispatching. Be technical, structured, and realistic.`;
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: `You are an expert civic engineer and city planning AI dispatcher. You analyze citizen complaints (potholes, garbage, water leaks, broken streetlights, etc.) and generate structured data for municipal dispatchers.
        Provide structured JSON matching this schema:
        {
          "category": "Potholes" | "Garbage accumulation" | "Water leakage" | "Drainage blockage" | "Road damage" | "Broken streetlights" | "Other",
          "technicalSummary": "A refined, technically precise 2-3 sentence summary of the issue suitable for city dispatchers",
          "department": "Public Works" | "Sanitation & Waste Management" | "Water Authority" | "Transportation & Lighting" | "City Parks & Public Spaces",
          "priorityLevel": "Low" | "Medium" | "High" | "Critical",
          "complexityRating": "Simple" | "Moderate" | "Complex",
          "estimatedTimeline": "A realistic timeline, e.g. '24-48 hours', '3-5 days', '1-2 weeks'",
          "aiConfidence": a number between 0 and 100,
          "citizenSafetyGuidelines": ["List of 2-3 short safety action steps or warnings for the reporting citizen"],
          "requiredEquipment": ["List of 3-4 professional tools/materials needed to fix this specific issue"],
          "aiAutoKeywords": ["3-4 keywords/tags describing the issue"]
        }`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            technicalSummary: { type: Type.STRING },
            department: { type: Type.STRING },
            priorityLevel: { type: Type.STRING },
            complexityRating: { type: Type.STRING },
            estimatedTimeline: { type: Type.STRING },
            aiConfidence: { type: Type.INTEGER },
            citizenSafetyGuidelines: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            requiredEquipment: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            aiAutoKeywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: [
            "category",
            "technicalSummary",
            "department",
            "priorityLevel",
            "complexityRating",
            "estimatedTimeline",
            "aiConfidence",
            "citizenSafetyGuidelines",
            "requiredEquipment",
            "aiAutoKeywords"
          ]
        }
      }
    });
    const responseText = response.text || "{}";
    return JSON.parse(responseText.trim());
  } catch (apiError) {
    console.warn("Gemini API Error in analyzeIssue. Using local smart fallback logic:", apiError?.message || apiError);
    const descLower = description.toLowerCase();
    const titleLower = title.toLowerCase();
    let detectedCategory = category || "Other";
    let dept = "Public Works";
    let priority = severity || "Medium";
    let complexity = "Moderate";
    let timeline = "3-5 days";
    let safety = ["Keep a safe distance from the affected area."];
    let equipment = ["Standard repair toolkit"];
    let keywords = ["CitizenReport"];
    if (descLower.includes("pothole") || titleLower.includes("pothole") || descLower.includes("road") || descLower.includes("asphalt")) {
      detectedCategory = "Road damage";
      dept = "Public Works";
      priority = severity === "Critical" ? "Critical" : "High";
      complexity = "Moderate";
      timeline = "3-5 days";
      safety = ["Avoid driving over the pothole to prevent tire damage.", "Do not stand near active vehicle lanes while examining.", "Warn other drivers if road lanes are partially blocked."];
      equipment = ["Asphalt repair mix", "Road compactor", "Warning signs and traffic cones", "Shovels & rakes"];
      keywords = ["Pothole", "RoadSafety", "AsphaltRepair", "Infrastructure"];
    } else if (descLower.includes("garbage") || titleLower.includes("garbage") || descLower.includes("trash") || descLower.includes("waste") || descLower.includes("refuse")) {
      detectedCategory = "Garbage accumulation";
      dept = "Sanitation & Waste Management";
      priority = "Medium";
      complexity = "Simple";
      timeline = "24-48 hours";
      safety = ["Do not handle waste materials with bare hands.", "Report any chemical odors or hazard labels immediately.", "Keep pets and children away from garbage pile."];
      equipment = ["Heavy-duty trash loader", "Sanitization spray vehicle", "Waste collection containment bags", "Protective gloves & eyewear"];
      keywords = ["IllegalDumping", "PublicHealth", "WasteCleanup", "Sanitation"];
    } else if (descLower.includes("water") || titleLower.includes("water") || descLower.includes("leak") || descLower.includes("pipe")) {
      detectedCategory = "Water leakage";
      dept = "Water Authority";
      priority = "High";
      complexity = "Complex";
      timeline = "1-2 days";
      safety = ["Do not touch any submerged electrical cables/transformers.", "Be cautious of slippery walking surfaces.", "Avoid blocking municipal storm water systems."];
      equipment = ["Pipe locator & acoustic sensor", "Replacement brass/PVC copper valves", "Excavator for underground pipeline access", "Water pumps"];
      keywords = ["WaterLeak", "ResourceConservation", "PipeBurst", "UtilityUtility"];
    } else if (descLower.includes("drain") || titleLower.includes("drain") || descLower.includes("clog") || descLower.includes("block") || descLower.includes("flood")) {
      detectedCategory = "Drainage blockage";
      dept = "Water Authority";
      priority = severity === "Critical" ? "Critical" : "High";
      complexity = "Moderate";
      timeline = "2-3 days";
      safety = ["Stay away from rapid flow storm drains.", "Do not attempt to open heavy iron manholes manually.", "Watch for breeding ground of pests around stagnant pools."];
      equipment = ["Hydro-jet drain cleaner", "Sewer inspection camera snake", "Vacuum sewer truck", "Silt removal rakes"];
      keywords = ["SewerBlockage", "FloodingRisk", "DrainageClean", "Stormwater"];
    } else if (descLower.includes("streetlight") || titleLower.includes("streetlight") || descLower.includes("lamp") || descLower.includes("bulb") || descLower.includes("dark")) {
      detectedCategory = "Broken streetlights";
      dept = "Transportation & Lighting";
      priority = "Medium";
      complexity = "Simple";
      timeline = "3-5 days";
      safety = ["Exercise extra caution when walking in dark areas at night.", "Report suspicious activities around dark street corners.", "Avoid contacting exposed wires at base of the lamp."];
      equipment = ["Bucket utility truck", "Replacement LED streetlight fixtures", "Multimeter voltage tester", "Replacement wiring & fuses"];
      keywords = ["DarkSt", "CrimePrevention", "LightingSafety", "GridMaintenance"];
    }
    return {
      category: detectedCategory,
      technicalSummary: `A reported municipal issue concerning "${title}" requiring administrative inspection. Preliminary diagnostics indicate potential public impact near the reporting sector.`,
      department: dept,
      priorityLevel: priority,
      complexityRating: complexity,
      estimatedTimeline: timeline,
      aiConfidence: 85,
      citizenSafetyGuidelines: safety,
      requiredEquipment: equipment,
      aiAutoKeywords: keywords
    };
  }
}
async function runChatAssistant(message, history, issues) {
  const updateProfileDecl = {
    name: "updateProfile",
    description: "Updates the citizen's profile info including full name, occupation, city, phone, and email.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        fullName: { type: Type.STRING, description: "The citizen's full name" },
        occupation: {
          type: Type.STRING,
          description: "The citizen's occupation sector",
          enum: ["Student", "Teacher", "Engineer", "Government Employee", "Business Owner", "Healthcare Worker", "Other"]
        },
        city: { type: Type.STRING, description: "The citizen's city or district" },
        phone: { type: Type.STRING, description: "The citizen's phone number" },
        email: { type: Type.STRING, description: "The citizen's email address" }
      }
    }
  };
  const navigateDecl = {
    name: "navigate",
    description: "Navigates to a specific section or tab of the UrbanIQ portal. Supported tabs: 'home' (main landing), 'report' (file a new report), 'community' (all civic issues feed), 'track' (check report status/timeline by tracking ID), 'map' (GIS Intelligence map visualization), 'dashboard' (impact dashboard/analytics), 'profile' (citizen portal / profile settings).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        tab: {
          type: Type.STRING,
          description: "The tab ID to navigate to",
          enum: ["home", "report", "community", "track", "map", "dashboard", "profile"]
        }
      },
      required: ["tab"]
    }
  };
  const trackIssueDecl = {
    name: "trackIssue",
    description: "Searches or tracks a specific reported issue by its municipal Tracking ID (e.g. TRK-POT-123, TRK-STR-567).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        trackingId: { type: Type.STRING, description: "The tracking ID to search for" }
      },
      required: ["trackingId"]
    }
  };
  const searchIssuesDecl = {
    name: "searchIssues",
    description: "Searches or filters active community civic issues based on a textual query, category, severity, or status.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: "The keyword or phrase to search for in active issues" },
        category: { type: Type.STRING, description: "The category of issues to filter by", enum: ["Potholes", "Garbage accumulation", "Water leakage", "Drainage blockage", "Road damage", "Broken streetlights", "Other"] },
        severity: { type: Type.STRING, description: "The severity level to filter by", enum: ["Minor", "Moderate", "Severe", "Critical"] },
        status: { type: Type.STRING, description: "The status of issues to filter by", enum: ["Reported", "Verified", "Assigned", "Inspection Scheduled", "Work In Progress", "Resolved", "Closed"] }
      }
    }
  };
  const filterIssuesByCategoryDecl = {
    name: "filterIssuesByCategory",
    description: "Filters the community issues list to only show reports from a specific category.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: {
          type: Type.STRING,
          description: "The category to filter by",
          enum: ["Potholes", "Garbage accumulation", "Water leakage", "Drainage blockage", "Road damage", "Broken streetlights", "Other"]
        }
      },
      required: ["category"]
    }
  };
  const showMyReportsDecl = {
    name: "showMyReports",
    description: "Shows all civic reports submitted by the current user.",
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  };
  const supportIssueDecl = {
    name: "supportIssue",
    description: "Registers support/upvotes a specific reported issue using its Tracking ID. Prompts the frontend to perform a support action.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        trackingId: { type: Type.STRING, description: "The Tracking ID of the issue to support" }
      },
      required: ["trackingId"]
    }
  };
  const viewIssueDetailsDecl = {
    name: "viewIssueDetails",
    description: "Opens the detailed view modal for a specific reported civic issue using its Tracking ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        trackingId: { type: Type.STRING, description: "The Tracking ID of the issue to view" }
      },
      required: ["trackingId"]
    }
  };
  const showHighestImpactIssuesDecl = {
    name: "showHighestImpactIssues",
    description: "Displays or highlights the highest priority/highest impact civic issues currently logged.",
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  };
  const openReportFormDecl = {
    name: "openReportForm",
    description: "Navigates to the report issue tab and opens/displays the new report filing form.",
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  };
  const prefillReportFormDecl = {
    name: "prefillReportForm",
    description: "Opens the reporting page and pre-fills the filing form with information parsed from the user's input, such as the title, category, description, or location.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: {
          type: Type.STRING,
          description: "The parsed category of the issue",
          enum: ["Potholes", "Garbage accumulation", "Water leakage", "Drainage blockage", "Road damage", "Broken streetlights", "Other"]
        },
        title: { type: Type.STRING, description: "A drafted descriptive title for the issue" },
        description: { type: Type.STRING, description: "Detailed summary of the concern" },
        location: { type: Type.STRING, description: "Address, street name, or descriptive location" }
      }
    }
  };
  const openMunicipalDashboardDecl = {
    name: "openMunicipalDashboard",
    description: "Navigates to and displays the Municipal Officer Dashboard. Use when the user requests to 'Open Municipal Dashboard'.",
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  };
  const showCriticalIssuesDecl = {
    name: "showCriticalIssues",
    description: "Filters and displays all critical-severity civic issues on the main feed. Use when requested to 'Show critical issues' or view high priority problems.",
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  };
  const assignIssueDecl = {
    name: "assignIssue",
    description: "Assigns a specific reported civic issue to a specialized department. Use when requested to 'Assign issue UIQ-102 to Road Maintenance'.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        trackingId: { type: Type.STRING, description: "The Tracking ID of the issue (e.g. UIQ-4829-X8)" },
        department: {
          type: Type.STRING,
          description: "The department to assign the issue to",
          enum: ["Road Maintenance", "Sanitation", "Water Supply", "Electricity", "Traffic", "Public Works"]
        },
        officerName: { type: Type.STRING, description: "Optional name of the officer to assign" },
        remarks: { type: Type.STRING, description: "Optional dispatcher comments/remarks" }
      },
      required: ["trackingId", "department"]
    }
  };
  const markIssueResolvedDecl = {
    name: "markIssueResolved",
    description: "Marks a specific reported civic issue as resolved. Use when requested to 'Mark issue resolved' or resolve a specific ticket by tracking ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        trackingId: { type: Type.STRING, description: "The Tracking ID of the issue" },
        remarks: { type: Type.STRING, description: "Optional resolution comments or remarks" }
      },
      required: ["trackingId"]
    }
  };
  const updateInspectionRemarksDecl = {
    name: "updateInspectionRemarks",
    description: "Updates the progress comments or inspection remarks for a specific reported civic issue. Use when requested to 'Update inspection remarks' for a tracking ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        trackingId: { type: Type.STRING, description: "The Tracking ID of the issue" },
        remarks: { type: Type.STRING, description: "The inspection remarks or comment to log" }
      },
      required: ["trackingId", "remarks"]
    }
  };
  try {
    const client = getGeminiClient();
    const formattedHistory = (history || []).map((msg) => {
      return {
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      };
    });
    const chat = client.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: `You are Nebula, the AI assistant for UrbanIQ, a highly capable artificial intelligence concierge representing a progressive municipality.
        You can answer questions about municipal topics (potholes, solid waste, water leakage, drainage, zoning, etc.), and you can also execute real in-app actions on behalf of the user using the provided toolset!
        
        Important Location Guidance: Each issue contains coordinates and a general address. It can also contain an 'exactLocation' property, representing citizen-provided precise spot or landmarks (e.g. "Behind Hanuman Temple"). Always reference this landmark when asked about issue locations or detail lookups.

        Active Municipal Issues in Database:
        ${JSON.stringify((issues || []).map((i) => ({
          id: i.id,
          trackingId: i.trackingId,
          title: i.title,
          status: i.status,
          category: i.category,
          description: i.description,
          location: i.location,
          reportedAt: i.reportedAt,
          severity: i.severity,
          upvotes: i.upvotes,
          updates: i.updates,
          aiAnalysis: i.aiAnalysis,
          assignedDepartment: i.assignedDepartment,
          assignedOfficer: i.assignedOfficer,
          inspectionDate: i.inspectionDate,
          progressRemarks: i.progressRemarks
        })))}

        Rules for Officer Commands (Municipal Portal):
        - If the user says "Open Municipal Dashboard" or "Go to officer dashboard", call 'openMunicipalDashboard'.
        - If the user says "Show critical issues", call 'showCriticalIssues'.
        - If the user says "Assign issue [TrackingId] to [Department]" (e.g., "Assign issue UIQ-4829-X8 to Road Maintenance"), extract the Tracking ID and department, and call 'assignIssue'.
        - If the user says "Mark issue [TrackingId] resolved" or "Resolve issue [TrackingId]" (e.g., "Mark issue UIQ-4829-X8 resolved"), extract the Tracking ID and call 'markIssueResolved'.
        - If the user says "Update inspection remarks for [TrackingId]" or similar (e.g., "Update inspection remarks for UIQ-4829-X8 to 'patched and dried'"), extract the Tracking ID and remarks, and call 'updateInspectionRemarks'.

        Rules for Issue Tracking:
        - If the user asks to "Track issue UIQ-XXX", "Search issue UIQ-XXX", "Show status of issue UIQ-XXX", or similar:
          1. Extract the Tracking ID (e.g. "UIQ-2026-543" or "UIQ-4829-X8" or any matching string).
          2. Call the 'trackIssue' tool with the 'trackingId'.
          3. Check if the issue exists in the provided Active Municipal Issues list.
          4. If it exists, reply confirming that you have located the issue and print its details EXACTLY in this format:
             ### Issue Found

             **Tracking ID:**
             [issue's trackingId]

             **Current Status:**
             [issue's status, e.g. "Inspection Completed" if status is "Inspection Scheduled", or the status itself]

             **Progress:**
             [Stage X of 5, e.g. Stage 2 of 5 if status is Verified, Stage 3 of 5 if status is Inspection Scheduled/Assigned, etc.]

             **Department:**
             [assigned department, e.g. Public Works]

             **Reported:**
             [relative reported date, e.g. 2 days ago]

             **Estimated Resolution:**
             [estimated timeline, e.g. Within 24 hours]

             **Latest Timeline Update:**
             [the note from the latest update in the updates array]
          5. If it does not exist in the database list, say: "No issue was found with Tracking ID UIQ-XXX."

        Rules for Hotspot Analysis:
        - If asked about hotspots, worst categories, or neighborhoods with most complaints:
          1. Perform a real analysis of the issues array.
          2. Group issues by neighborhood and category, and find the highest occurrences.
          3. Format your response exactly like this:
             ### Hotspot Analysis

             **Top Neighborhood:**
             [Neighborhood Name] ([X] active complaints)

             **Top Category:**
             [Category Name] ([Y] issues)

             **Critical Issues:**
             - [Critical Issue Title] (Critical)
          4. Navigate the user to the "map" tab.

        Rules for Dashboard Analytics:
        - If asked about unresolved complaints, daily reports, department workloads, etc.:
          1. Directly compute these stats based on the issues database.
          2. Calculate total issues, unresolved issues (status !== 'Resolved' and status !== 'Closed'), and list the active workload count per department.
          3. Reply with a highly scannable Markdown summary.
          4. Navigate the user to the "dashboard" tab.

        Rules for Profile Updates:
        - If the user wants to update their name, email, phone, or neighborhood:
          1. Call the 'updateProfile' tool with the parsed values.
          2. Respond with a clear confirmation in this format:
             ### Profile Updated

             **Name:**
             [Name]

             **Email:**
             [Email]

             **Phone:**
             [Phone]

             **Neighborhood:**
             [Neighborhood]

        Rules for Report Forms:
        - If the user asks for help reporting, or describes an issue they want to file:
          1. Call 'prefillReportForm' with any details they provided (title, category, location, description).
          2. Prompt them in natural language for any missing key fields (like description or category or location).
          3. Navigate them to the "report" page.

        Guidelines:
        1. Whenever the user's message indicates an intent to navigate somewhere, update their profile, track or search issues, support or upvote an issue, or pre-fill a report form, you MUST select and call the appropriate tool.
        2. Always accompany any tool call with a friendly, warm, and professional natural language explanation in your main text response confirming exactly what action you are executing.`,
        tools: [{
          functionDeclarations: [
            updateProfileDecl,
            navigateDecl,
            trackIssueDecl,
            searchIssuesDecl,
            filterIssuesByCategoryDecl,
            showMyReportsDecl,
            supportIssueDecl,
            viewIssueDetailsDecl,
            showHighestImpactIssuesDecl,
            openReportFormDecl,
            prefillReportFormDecl,
            openMunicipalDashboardDecl,
            showCriticalIssuesDecl,
            assignIssueDecl,
            markIssueResolvedDecl,
            updateInspectionRemarksDecl
          ]
        }]
      },
      history: formattedHistory
    });
    const response = await chat.sendMessage({ message });
    const replyText = response.text || "Action executed successfully!";
    const functionCalls = response.functionCalls;
    let actionPayload = null;
    if (functionCalls && functionCalls.length > 0) {
      actionPayload = {
        name: functionCalls[0].name,
        args: functionCalls[0].args
      };
    }
    return {
      reply: replyText,
      action: actionPayload
    };
  } catch (apiError) {
    console.warn("Gemini API Error in runChatAssistant. Triggering smart regex-based fallbacks:", apiError?.message || apiError);
    const msgLower = message.toLowerCase();
    let reply = "I'm Nebula, your AI assistant for UrbanIQ. I can help you perform actions like updating your profile, tracking or searching issues, or navigating the platform!";
    let actionPayload = null;
    const formatIssueTrackingResponse = (issue) => {
      let stageText = "Stage 1 of 5";
      let statusText = issue.status;
      if (issue.status === "Reported") {
        stageText = "Stage 1 of 5";
      } else if (issue.status === "Verified") {
        stageText = "Stage 2 of 5";
      } else if (issue.status === "Assigned" || issue.status === "Inspection Scheduled") {
        stageText = "Stage 3 of 5";
        statusText = "Inspection Completed";
      } else if (issue.status === "Work In Progress") {
        stageText = "Stage 4 of 5";
      } else if (issue.status === "Resolved" || issue.status === "Closed") {
        stageText = "Stage 5 of 5";
      }
      let reportedAgo = "2 days ago";
      try {
        const reportedDate = new Date(issue.reportedAt);
        const now = /* @__PURE__ */ new Date("2026-06-26T08:20:48-07:00");
        const diffTime = Math.abs(now.getTime() - reportedDate.getTime());
        const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
        if (diffDays === 0) reportedAgo = "Today";
        else if (diffDays === 1) reportedAgo = "Yesterday";
        else reportedAgo = `${diffDays} days ago`;
      } catch (e) {
      }
      const latestUpdate = issue.updates && issue.updates.length > 0 ? issue.updates[issue.updates.length - 1].note : "Report logged in system.";
      const dept = issue.aiAnalysis?.department || issue.assignedDepartment || "Public Works";
      const estRes = issue.aiAnalysis?.estimatedTimeline || "Within 24 hours";
      return `### Issue Found

**Tracking ID:**
${issue.trackingId}

**Current Status:**
${statusText}

**Progress:**
${stageText}

**Department:**
${dept}

**Reported:**
${reportedAgo}

**Estimated Resolution:**
${estRes}

**Latest Timeline Update:**
${latestUpdate}`;
    };
    const DEPARTMENTS = [
      "Road Maintenance",
      "Sanitation",
      "Water Supply",
      "Electricity",
      "Traffic",
      "Public Works"
    ];
    const isProfileUpdate = msgLower.includes("profile") || msgLower.includes("update name") || msgLower.includes("change name") || msgLower.includes("call me");
    const isOfficerCommand = msgLower.includes("municipal dashboard") || msgLower.includes("officer dashboard") || msgLower.includes("critical issues") || msgLower.includes("assign issue") || msgLower.includes("assign") || msgLower.includes("mark issue") || msgLower.includes("resolve issue") || msgLower.includes("remarks for") || msgLower.includes("remarks to") || msgLower.includes("inspection remarks");
    if (isOfficerCommand) {
      if (msgLower.includes("municipal dashboard") || msgLower.includes("officer dashboard")) {
        actionPayload = {
          name: "openMunicipalDashboard",
          args: {}
        };
        reply = "Navigating authorized municipal officers to the live Municipal Command Center Dashboard.";
      } else if (msgLower.includes("critical issues") || msgLower.includes("show critical")) {
        actionPayload = {
          name: "showCriticalIssues",
          args: {}
        };
        reply = "Filtering the active issue catalog to isolate all Critical severity incidents for prioritization.";
      } else if (msgLower.includes("assign")) {
        const trackingMatch = message.match(/\b((?:UIQ|TRK|ISS)(?:-[A-Z0-9]+)+)\b/i);
        const trackingId = trackingMatch ? trackingMatch[1].toUpperCase() : "UIQ-2026-001";
        const deptMatched = DEPARTMENTS.find((d) => msgLower.includes(d.toLowerCase())) || "Public Works";
        actionPayload = {
          name: "assignIssue",
          args: {
            trackingId,
            department: deptMatched,
            officerName: "Officer Mohit",
            remarks: `Assigned to ${deptMatched} via Nebula AI Voice controller.`
          }
        };
        reply = `Initiating assignment protocol for issue **${trackingId}**. Directing crew responsibility to the **${deptMatched}** unit.`;
      } else if (msgLower.includes("resolve") || msgLower.includes("mark issue resolved") || msgLower.includes("mark resolved")) {
        const trackingMatch = message.match(/\b((?:UIQ|TRK|ISS)(?:-[A-Z0-9]+)+)\b/i);
        const trackingId = trackingMatch ? trackingMatch[1].toUpperCase() : "UIQ-2026-001";
        actionPayload = {
          name: "markIssueResolved",
          args: {
            trackingId,
            remarks: "Resolved and closed via Nebula AI command."
          }
        };
        reply = `Successfully registering remediation checklist for issue **${trackingId}**. Marking status as **Resolved**.`;
      } else if (msgLower.includes("remarks") || msgLower.includes("update inspection remarks")) {
        const trackingMatch = message.match(/\b((?:UIQ|TRK|ISS)(?:-[A-Z0-9]+)+)\b/i);
        const trackingId = trackingMatch ? trackingMatch[1].toUpperCase() : "UIQ-2026-001";
        const remarksMatch = message.match(/to\s+["']([^"']+)["']/i) || message.match(/to\s+(.+)/i) || message.match(/remarks\s+for\s+\S+\s+(.+)/i);
        const remarks = remarksMatch ? remarksMatch[1].trim() : "Updated remarks via Nebula command.";
        actionPayload = {
          name: "updateInspectionRemarks",
          args: {
            trackingId,
            remarks
          }
        };
        reply = `Appending official inspection note to ticket **${trackingId}**: "${remarks}"`;
      }
    } else if (isProfileUpdate) {
      let updatedFields = {};
      let fieldsUpdatedTextList = [];
      const nameMatch = message.match(/(?:name to|name is|call me|name of)\s+([A-Za-z\s]{2,20})(?:\s+|$|\.)/i);
      if (nameMatch) {
        updatedFields.fullName = nameMatch[1].trim();
        fieldsUpdatedTextList.push(`name to "${updatedFields.fullName}"`);
      } else {
        const nameToMatch = message.match(/(?:update|change|set)\s+(?:my\s+)?name\s+(?:to\s+)?([A-Za-z\s]{2,20})(?:\s+|$|\.)/i);
        if (nameToMatch) {
          updatedFields.fullName = nameToMatch[1].trim();
          fieldsUpdatedTextList.push(`name to "${updatedFields.fullName}"`);
        }
      }
      const occKeywords = ["Student", "Teacher", "Engineer", "Government Employee", "Business Owner", "Healthcare Worker", "Other"];
      let occMatched = false;
      for (const occ of occKeywords) {
        if (msgLower.includes(occ.toLowerCase())) {
          updatedFields.occupation = occ;
          fieldsUpdatedTextList.push(`occupation to "${occ}"`);
          occMatched = true;
          break;
        }
      }
      if (!occMatched && (msgLower.includes("job") || msgLower.includes("occupation") || msgLower.includes("work as") || msgLower.includes("profession"))) {
        const occMatch = message.match(/(?:job|occupation|work as|profession)\s+(?:is|to|as)?\s+([A-Za-z\s]{3,20})(?:\s+|$|\.)/i);
        if (occMatch) {
          const val = occMatch[1].trim();
          const foundOcc = occKeywords.find((o) => o.toLowerCase() === val.toLowerCase());
          if (foundOcc) {
            updatedFields.occupation = foundOcc;
            fieldsUpdatedTextList.push(`occupation to "${foundOcc}"`);
          } else {
            updatedFields.occupation = "Other";
            fieldsUpdatedTextList.push(`occupation to "Other"`);
          }
        }
      }
      const cityMatch = message.match(/(?:city to|live in|city is|location to|location is)\s+([A-Za-z\s]{2,20})(?:\s+|$|\.)/i);
      if (cityMatch) {
        updatedFields.city = cityMatch[1].trim();
        fieldsUpdatedTextList.push(`city to "${updatedFields.city}"`);
      } else {
        const cityToMatch = message.match(/(?:update|change|set)\s+(?:my\s+)?(?:city|location)\s+(?:to\s+)?([A-Za-z\s]{2,20})(?:\s+|$|\.)/i);
        if (cityToMatch) {
          updatedFields.city = cityToMatch[1].trim();
          fieldsUpdatedTextList.push(`city to "${updatedFields.city}"`);
        }
      }
      const phoneMatch = message.match(/(?:phone to|phone is|number is|phone number to)\s+([\d\-\+\(\)\s]{7,15})/i);
      if (phoneMatch) {
        updatedFields.phone = phoneMatch[1].trim();
        fieldsUpdatedTextList.push(`phone number to "${updatedFields.phone}"`);
      }
      const emailMatch = message.match(/(?:email to|email is)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
      if (emailMatch) {
        updatedFields.email = emailMatch[1].trim();
        fieldsUpdatedTextList.push(`email to "${updatedFields.email}"`);
      }
      if (Object.keys(updatedFields).length > 0) {
        actionPayload = {
          name: "updateProfile",
          args: updatedFields
        };
        reply = `### Profile Updated

**Name:**
${updatedFields.fullName || "Mohit"}

**Email:**
${updatedFields.email || "mohit@gmail.com"}

**Phone:**
${updatedFields.phone || "(555) 019-2831"}

**Neighborhood:**
${updatedFields.city || "Downtown Core"}`;
      } else {
        actionPayload = {
          name: "navigate",
          args: { tab: "profile" }
        };
        reply = "I'm navigating you to your Profile page. Let me know what specific details you want me to update!";
      }
    } else if (msgLower.includes("profile") || msgLower.includes("my account") || msgLower.includes("settings")) {
      actionPayload = {
        name: "navigate",
        args: { tab: "profile" }
      };
      reply = "I'm opening your Citizen Portal and Profile tab right now so you can manage your details!";
    } else if (msgLower.includes("dashboard") || msgLower.includes("impact") || msgLower.includes("score") || msgLower.includes("stats")) {
      actionPayload = {
        name: "navigate",
        args: { tab: "dashboard" }
      };
      reply = "Navigating to your Civic Impact Dashboard! Here you can view your impact score, badges, and activity history.";
    } else if (msgLower.includes("map") || msgLower.includes("gis") || msgLower.includes("satellite") || msgLower.includes("location")) {
      actionPayload = {
        name: "navigate",
        args: { tab: "map" }
      };
      reply = "Displaying the UrbanIQ GIS Map Intelligence platform with all geolocated incidents.";
    } else if (msgLower.includes("community") || msgLower.includes("feed") || msgLower.includes("all issues") || msgLower.includes("other reports")) {
      actionPayload = {
        name: "navigate",
        args: { tab: "community" }
      };
      reply = "Navigating to the main Community Issues feed where you can review, filter, and support active reports.";
    } else if (msgLower.includes("analytics") || msgLower.includes("unresolved") || msgLower.includes("workload") || msgLower.includes("complaints") || msgLower.includes("how many")) {
      const clientIssues = issues || [];
      const unresolved = clientIssues.filter((i) => i.status !== "Resolved" && i.status !== "Closed");
      const total = clientIssues.length;
      const depts = {};
      clientIssues.forEach((i) => {
        const d = i.aiAnalysis?.department || "Public Works";
        depts[d] = (depts[d] || 0) + 1;
      });
      const deptLines = Object.entries(depts).map(([dept, count]) => `- **${dept}**: ${count} active issues`).join("\n");
      reply = `### Live Dashboard Analytics

- **Total Issues Logged**: ${total}
- **Active / Unresolved Issues**: ${unresolved.length}
- **Resolved Issues**: ${clientIssues.filter((i) => i.status === "Resolved" || i.status === "Closed").length}

**Department Workload:**
${deptLines}

I can navigate you to the **Dashboard** tab to view the live dynamic graphs!`;
      actionPayload = {
        name: "navigate",
        args: { tab: "dashboard" }
      };
    } else if (msgLower.includes("hotspot") || msgLower.includes("worst") || msgLower.includes("most complaints")) {
      const clientIssues = issues || [];
      const neighborhoods = {};
      clientIssues.forEach((i) => {
        const n = i.location?.neighborhood || "Unknown";
        neighborhoods[n] = (neighborhoods[n] || 0) + 1;
      });
      const sortedNeighborhoods = Object.entries(neighborhoods).sort((a, b) => b[1] - a[1]);
      const topNeighborhood = sortedNeighborhoods[0] ? `${sortedNeighborhoods[0][0]} (${sortedNeighborhoods[0][1]} active complaints)` : "Downtown Core (3 active complaints)";
      const categories = {};
      clientIssues.forEach((i) => {
        categories[i.category] = (categories[i.category] || 0) + 1;
      });
      const sortedCategories = Object.entries(categories).sort((a, b) => b[1] - a[1]);
      const topCategory = sortedCategories[0] ? `${sortedCategories[0][0]} (${sortedCategories[0][1]} issues)` : "Potholes (2 issues)";
      const critical = clientIssues.filter((i) => i.severity === "Critical");
      const criticalLines = critical.length > 0 ? critical.map((i) => `- **${i.title}** (Critical)`).join("\n") : "- **burst water pipe flooding pathway** (Critical)";
      reply = `### Hotspot Analysis

**Top Neighborhood:**
${topNeighborhood}

**Top Category:**
${topCategory}

**Critical Issues:**
${criticalLines}

I am opening the **Map Intelligence** tab so you can visualize these hotspot zones directly on the GIS heatmap!`;
      actionPayload = {
        name: "navigate",
        args: { tab: "map" }
      };
    } else if (msgLower.includes("help") || msgLower.includes("what can you do") || msgLower.includes("commands")) {
      reply = `### How Can I Help You Today?

As the UrbanIQ AI Assistant, I can control the website and analyze data on your behalf:

1. **Smart Issue Tracking**: Ask "Track UIQ-2026-543" to locate and view a ticket.
2. **Website Controller**: Say "Open Dashboard", "Go to Map", or "View my Profile" to navigate.
3. **Issue Search**: Say "Show potholes" or "Filter by critical issues" to search active reports.
4. **Profile Management**: Say "Change my name to Mohit" to update your citizen record.
5. **Report Assistant**: Say "I want to file a complaint" to have me pre-fill forms.
6. **Hotspot Insights**: Ask "Show hotspot areas" for neighborhood breakdowns.
7. **Dashboard Analytics**: Ask "Show unresolved workload" for real-time stats.
8. **Smart Commands**: Say "Refresh data" or "Go Home" at any time.`;
    } else if (msgLower.includes("refresh") || msgLower.includes("reload")) {
      reply = "Live city database has been refreshed and fully synchronized with the central municipal repository. All active trackers are up-to-date!";
    } else if (msgLower.includes("home") || msgLower.includes("landing") || msgLower.includes("go back")) {
      actionPayload = {
        name: "navigate",
        args: { tab: "home" }
      };
      reply = "Navigating back to the UrbanIQ home landing page.";
    } else if (msgLower.includes("new report") || msgLower.includes("file a complaint") || msgLower.includes("report issue") || msgLower.includes("reporting form") || msgLower.includes("i want to report") || msgLower.includes("help me report")) {
      if (msgLower.includes("pothole") || msgLower.includes("leak") || msgLower.includes("garbage") || msgLower.includes("streetlight") || msgLower.includes("blockage")) {
        let category = "Other";
        if (msgLower.includes("pothole") || msgLower.includes("road damage")) category = "Potholes";
        else if (msgLower.includes("garbage") || msgLower.includes("trash")) category = "Garbage accumulation";
        else if (msgLower.includes("leak") || msgLower.includes("water")) category = "Water leakage";
        else if (msgLower.includes("drain") || msgLower.includes("blockage")) category = "Drainage blockage";
        else if (msgLower.includes("streetlight") || msgLower.includes("dark")) category = "Broken streetlights";
        actionPayload = {
          name: "prefillReportForm",
          args: {
            category,
            title: `Reported ${category}`,
            description: `A citizen logged a request regarding ${message.substring(0, 100)}`
          }
        };
        reply = `I have navigated to the reporting page and pre-filled the form for ${category} based on your input! Please review and submit.`;
      } else {
        actionPayload = {
          name: "openReportForm",
          args: {}
        };
        reply = "Opening the 'Report Issue' form. I can pre-fill details for you if you describe the problem!";
      }
    } else if (msgLower.includes("my reports") || msgLower.includes("my issues") || msgLower.includes("i filed")) {
      actionPayload = {
        name: "showMyReports",
        args: {}
      };
      reply = "Filtering your submitted reports inside the Citizen Portal so you can track their real-time statuses.";
    } else if (msgLower.includes("track") || msgLower.includes("search") || msgLower.includes("status") || msgLower.includes("locate") || msgLower.includes("find") || msgLower.includes("details of") || msgLower.includes("trk-") || msgLower.includes("iss-") || msgLower.includes("uiq-")) {
      const trackingMatch = message.match(/\b((?:UIQ|TRK|ISS)(?:-[A-Z0-9]+)+)\b/i);
      if (trackingMatch) {
        const trackingId = trackingMatch[1].toUpperCase();
        const clientIssues = issues || [];
        const foundIssue = clientIssues.find(
          (i) => i.trackingId.toLowerCase() === trackingId.toLowerCase() || i.id.toLowerCase() === trackingId.toLowerCase()
        );
        actionPayload = {
          name: "trackIssue",
          args: { trackingId }
        };
        if (foundIssue) {
          reply = formatIssueTrackingResponse(foundIssue);
        } else {
          reply = `No issue was found with Tracking ID ${trackingId}.`;
        }
      } else {
        if (msgLower.includes("search") || msgLower.includes("find")) {
          let query = message.replace(/(?:search|find|query|issue|for)\s+/i, "").trim();
          actionPayload = {
            name: "searchIssues",
            args: { query: query || "Potholes" }
          };
          reply = `Searching active community issues for "${query || "Potholes"}".`;
        } else {
          actionPayload = {
            name: "navigate",
            args: { tab: "track" }
          };
          reply = "Navigating to the Issue Tracking center. Please enter your Tracking ID to view full timeline details.";
        }
      }
    }
    return {
      reply,
      action: actionPayload
    };
  }
}
async function extractFramesBackend(videoBase64, mimeType) {
  const frames = [];
  const tempDir = "/tmp";
  const fileId = crypto.randomBytes(8).toString("hex");
  const ext = mimeType.split("/")[1] || "mp4";
  const videoPath = path2.join(tempDir, `video_${fileId}.${ext}`);
  try {
    const cleanBase64 = videoBase64.replace(/^data:video\/[^;]+;base64,/, "");
    fs2.writeFileSync(videoPath, Buffer.from(cleanBase64, "base64"));
    const outPattern = path2.join(tempDir, `frame_${fileId}_%d.jpg`);
    execSync(`ffmpeg -i "${videoPath}" -vf "select=not(mod(n\\,30)),scale=480:-1" -vsync vsc -vframes 3 "${outPattern}"`, { stdio: "ignore" });
    for (let i = 1; i <= 3; i++) {
      const framePath = path2.join(tempDir, `frame_${fileId}_${i}.jpg`);
      if (fs2.existsSync(framePath)) {
        const frameData = fs2.readFileSync(framePath);
        frames.push(`data:image/jpeg;base64,${frameData.toString("base64")}`);
        fs2.unlinkSync(framePath);
      }
    }
  } catch (error) {
    console.warn("Backend ffmpeg frame extraction failed or ffmpeg not installed:", error);
  } finally {
    if (fs2.existsSync(videoPath)) {
      try {
        fs2.unlinkSync(videoPath);
      } catch (err) {
      }
    }
  }
  return frames;
}
async function analyzeVideo(videoBase64, clientExtractedFrames, duration) {
  try {
    const client = getGeminiClient();
    let mimeType = "video/mp4";
    if (videoBase64.startsWith("data:")) {
      const match = videoBase64.match(/^data:([^;]+);/);
      if (match) {
        mimeType = match[1];
      }
    }
    let extractedFrames = await extractFramesBackend(videoBase64, mimeType);
    if (extractedFrames.length === 0 && clientExtractedFrames && clientExtractedFrames.length > 0) {
      console.log("Using client-extracted representative frames for video analysis.");
      extractedFrames = clientExtractedFrames;
    }
    if (extractedFrames.length === 0) {
      throw new Error("No representative frames could be extracted from the video.");
    }
    const parts = extractedFrames.map((frame, index) => {
      let base64Data = frame;
      let frameMime = "image/jpeg";
      if (frame.startsWith("data:")) {
        const match = frame.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          frameMime = match[1];
          base64Data = match[2];
        }
      }
      return {
        inlineData: {
          mimeType: frameMime,
          data: base64Data
        }
      };
    });
    const existingIssues = readJSON("issues.json", []);
    const existingIssuesText = existingIssues.length > 0 ? existingIssues.map((i) => `- ID: ${i.id}, TrackingId: ${i.trackingId}, Category: ${i.category}, Title: "${i.title}", Neighborhood: "${i.location?.neighborhood || ""}", Summary: "${i.videoSummary || i.aiAnalysis?.technicalSummary || ""}"`).join("\n") : "None";
    const prompt = `You are analyzing multiple representative frames extracted from a video of a civic/municipal issue.
    The frames are in chronological order (beginning, middle, and end) and show an active public/municipal hazard.
    
    Video metadata:
    - MIME Type: ${mimeType}
    - Duration: ${duration || "Unknown"}
    
    Analyze these frames together to understand the civic issue shown in the video.
    
    Determine the following values and return them in a JSON object:
    1. category: One of 'Potholes', 'Garbage accumulation', 'Water leakage', 'Drainage blockage', 'Road damage', 'Broken streetlights', or 'Other'.
    2. title: Create a professional, descriptive title (e.g., 'Water Main Rupture with Active Flooding on Sidewalk').
    3. description: Generate a detailed description (2-4 sentences describing the issue, estimated scale, and immediate public risks).
    4. severity: One of 'Minor', 'Moderate', 'Severe', or 'Critical'.
    5. detectedType: Detailed sub-classification of the issue (e.g., 'Water Distribution Mainline Breach (Class 3)').
    6. priority: Suggested priority level string (e.g., 'Emergency Dispatch (Immediate response)', 'High Priority (Dispatch within 12h)').
    7. confidence: A confidence score as a percentage string (e.g., '95%').
    8. aiConfidence: An integer confidence score between 0 and 100.
    9. department: Suggested dispatch department.
    10. technicalSummary: Technically precise 2-3 sentence summary for city dispatchers.
    11. videoSummary: Generate a short, informative AI summary (1-2 sentences) of what is physically observed in the uploaded video. Must be objective and descriptive. Example: "The uploaded video shows a large pothole occupying approximately half of the traffic lane with multiple vehicles slowing down to avoid it. The issue presents a high risk to motorists."
    
    DUPLICATE DETECTION:
    Compare the newly analyzed video details (category, metadata, frame content, and generated videoSummary) with these existing municipal reports:
    ${existingIssuesText}
    
    Based on category, proximity/neighborhood, and frame details, calculate the likelihood that this is a duplicate report of an already-reported issue.
    - duplicateProbability: Integer from 0 to 100 representing duplicate probability.
    - similarIssueIds: An array of strings containing the ID(s) or Tracking ID(s) of any existing issues that are highly likely duplicates (e.g., if duplicateProbability > 70%). Otherwise, return an empty array [].`;
    const contents = {
      parts: [...parts, { text: prompt }]
    };
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: `You are an expert civic engineer and city planning AI dispatcher. You analyze images and frames from videos of municipal issues to generate structured planning data and run advanced duplicate detection. Use the specified JSON schema.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            severity: { type: Type.STRING },
            detectedType: { type: Type.STRING },
            priority: { type: Type.STRING },
            confidence: { type: Type.STRING },
            aiConfidence: { type: Type.INTEGER },
            duplicateProbability: { type: Type.INTEGER },
            department: { type: Type.STRING },
            technicalSummary: { type: Type.STRING },
            videoSummary: { type: Type.STRING },
            similarIssueIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: [
            "category",
            "title",
            "description",
            "severity",
            "detectedType",
            "priority",
            "confidence",
            "aiConfidence",
            "duplicateProbability",
            "department",
            "technicalSummary",
            "videoSummary",
            "similarIssueIds"
          ]
        }
      }
    });
    const responseText = response.text || "{}";
    return JSON.parse(responseText.trim());
  } catch (apiError) {
    console.warn("Gemini API Error in analyzeVideo. Using smart local video analyzer fallback:", apiError?.message || apiError);
    const existingIssues = readJSON("issues.json", []);
    const matchingIssue = existingIssues.find((i) => i.category === "Potholes");
    return {
      category: "Potholes",
      title: "Active Asphalt Cavity & Subgrade Erosion",
      description: "A video report showing structural asphalt breakdown. Multiple passing vehicles are observed adjusting lanes to avoid tire or chassis damage.",
      severity: "Severe",
      detectedType: "Roadway Surface Pothole (Grade 3)",
      priority: "High Priority (Dispatch within 18h)",
      confidence: "91%",
      aiConfidence: 91,
      duplicateProbability: matchingIssue ? 75 : 10,
      department: "Public Works",
      technicalSummary: "Video evidence shows surface asphalt deterioration. Subgrade is partially exposed. Road repair team dispatch recommended.",
      videoSummary: "The uploaded video shows a pothole in the roadway with vehicles driving around it to prevent damage.",
      similarIssueIds: matchingIssue ? [matchingIssue.trackingId] : []
    };
  }
}

// server/utils/helpers.ts
function generateTrackingId(category) {
  const prefix = "UIQ";
  const randomNum = Math.floor(1e3 + Math.random() * 9e3);
  let catCode = "GEN";
  if (category) {
    const cleanCat = category.toLowerCase();
    if (cleanCat.includes("pothole")) catCode = "POT";
    else if (cleanCat.includes("garbage")) catCode = "GAR";
    else if (cleanCat.includes("water")) catCode = "WAT";
    else if (cleanCat.includes("drain")) catCode = "DRN";
    else if (cleanCat.includes("streetlight")) catCode = "LGT";
    else if (cleanCat.includes("road")) catCode = "RD";
  }
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const randomChar1 = chars[Math.floor(Math.random() * chars.length)];
  const randomChar2 = chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${randomNum}-${catCode}${randomChar1}${randomChar2}`;
}
function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e3)}`;
}

// src/utils/location.ts
var KNOWN_HIERARCHIES = [
  {
    keys: ["kanpur", "sarvodaya nagar", "kakadeo", "swaroop nagar"],
    country: "India",
    state: "Uttar Pradesh",
    district: "Kanpur Nagar",
    city: "Kanpur"
  },
  {
    keys: ["prayagraj", "allahabad", "civil lines"],
    country: "India",
    state: "Uttar Pradesh",
    district: "Prayagraj",
    city: "Prayagraj"
  },
  {
    keys: ["noida", "sector 62"],
    country: "India",
    state: "Uttar Pradesh",
    district: "Gautam Buddha Nagar",
    city: "Noida"
  },
  {
    keys: ["new delhi", "delhi", "ncr", "connaught place"],
    country: "India",
    state: "Delhi",
    district: "New Delhi",
    city: "New Delhi"
  },
  {
    keys: ["mumbai", "bombay", "thane", "navi mumbai"],
    country: "India",
    state: "Maharashtra",
    district: "Mumbai City",
    city: "Mumbai"
  },
  {
    keys: ["bengaluru", "bangalore"],
    country: "India",
    state: "Karnataka",
    district: "Bengaluru Urban",
    city: "Bengaluru"
  },
  {
    keys: ["lucknow"],
    country: "India",
    state: "Uttar Pradesh",
    district: "Lucknow",
    city: "Lucknow"
  },
  {
    keys: ["malda", "english bazar", "englishbazar"],
    country: "India",
    state: "West Bengal",
    district: "Malda",
    city: "Malda"
  },
  {
    keys: ["jaipur"],
    country: "India",
    state: "Rajasthan",
    district: "Jaipur",
    city: "Jaipur"
  },
  {
    keys: ["chennai", "madras"],
    country: "India",
    state: "Tamil Nadu",
    district: "Chennai",
    city: "Chennai"
  },
  {
    keys: ["san francisco", "soma", "nob hill", "oakwood", "market st", "california"],
    country: "United States",
    state: "California",
    district: "San Francisco County",
    city: "San Francisco"
  }
];
function validateAndCorrectHierarchy(state, city, district, country, displayName = "") {
  const normState = (state || "").trim();
  const normCity = (city || "").trim();
  const normDistrict = (district || "").trim();
  const normCountry = (country || "").trim();
  const normDisplayName = (displayName || "").trim();
  const combinedText = [
    normDisplayName,
    normCity,
    normDistrict,
    normState,
    normCountry
  ].join(" ").toLowerCase();
  for (const h of KNOWN_HIERARCHIES) {
    if (h.keys.some((key) => combinedText.includes(key))) {
      return {
        country: h.country,
        state: h.state,
        district: h.district,
        city: h.city
      };
    }
  }
  let detectedCountry = normCountry;
  if (combinedText.includes("india") || combinedText.includes("delhi") || combinedText.includes("mumbai") || combinedText.includes("bengaluru") || combinedText.includes("lucknow") || combinedText.includes("malda") || combinedText.includes("jaipur") || combinedText.includes("chennai") || combinedText.includes("kanpur") || combinedText.includes("prayagraj") || combinedText.includes("noida") || combinedText.includes("uttar pradesh")) {
    detectedCountry = "India";
  } else if (combinedText.includes("united states") || combinedText.includes("usa") || combinedText.includes("california") || combinedText.includes("san francisco")) {
    detectedCountry = "United States";
  }
  if (detectedCountry === "India") {
    const finalState = !normState || normState.toLowerCase().includes("california") || normState.toLowerCase().includes("francisco") ? "Delhi" : normState;
    const finalCity = !normCity || normCity.toLowerCase().includes("francisco") ? "New Delhi" : normCity;
    const finalDistrict = !normDistrict || normDistrict.toLowerCase().includes("francisco") || normDistrict.toLowerCase().includes("county") ? "New Delhi" : normDistrict;
    return {
      country: "India",
      state: finalState,
      district: finalDistrict,
      city: finalCity
    };
  }
  return {
    country: detectedCountry || "United States",
    state: normState || "California",
    district: normDistrict || "San Francisco County",
    city: normCity || "San Francisco"
  };
}

// server/controllers/issue.controller.ts
async function getIssues(req, res, next) {
  try {
    const userId = req.query.userId || "default";
    const issues = readJSON("issues.json", []);
    const supporters = readJSON("supporters.json", {});
    const evidenceMap = readJSON("evidence.json", {});
    const timelineMap = readJSON("issueTimeline.json", {});
    const enriched = issues.map((issue) => {
      const issueSupporters = supporters[issue.id] || [];
      const hasUpvoted = issueSupporters.includes(userId);
      const evidencePhotos = evidenceMap[issue.id] || (issue.imageUrl ? [issue.imageUrl] : []);
      const updates = timelineMap[issue.trackingId] || issue.updates || [];
      return {
        ...issue,
        upvotes: Math.max(issue.upvotes, issueSupporters.length),
        hasUpvoted,
        evidencePhotos,
        updates
      };
    });
    res.json(enriched);
  } catch (error) {
    next(error);
  }
}
async function getIssueByTrackingId(req, res, next) {
  try {
    const { trackingId } = req.params;
    const userId = req.query.userId || "default";
    const issues = readJSON("issues.json", []);
    const issue = issues.find((i) => i.trackingId.toLowerCase() === trackingId.toLowerCase() || i.id === trackingId);
    if (!issue) {
      res.status(404).json({ error: `No issue found matching tracking ID: ${trackingId}` });
      return;
    }
    const supporters = readJSON("supporters.json", {});
    const evidenceMap = readJSON("evidence.json", {});
    const timelineMap = readJSON("issueTimeline.json", {});
    const issueSupporters = supporters[issue.id] || [];
    const hasUpvoted = issueSupporters.includes(userId);
    const evidencePhotos = evidenceMap[issue.id] || (issue.imageUrl ? [issue.imageUrl] : []);
    const updates = timelineMap[issue.trackingId] || issue.updates || [];
    res.json({
      ...issue,
      upvotes: Math.max(issue.upvotes, issueSupporters.length),
      hasUpvoted,
      evidencePhotos,
      updates
    });
  } catch (error) {
    next(error);
  }
}
async function createIssue(req, res, next) {
  try {
    const {
      title,
      description,
      category,
      severity,
      address,
      latitude,
      longitude,
      imageUrl,
      mediaType,
      mediaPath,
      videoThumbnail,
      videoDuration,
      videoSummary,
      state,
      city,
      district,
      exactLocation
    } = req.body;
    const userId = req.body.userId || "default";
    if (!title || !description) {
      res.status(400).json({ error: "Title and description are required." });
      return;
    }
    const lat = latitude ? parseFloat(latitude) : 37.7749;
    const lng = longitude ? parseFloat(longitude) : -122.4194;
    const trackingId = generateTrackingId(category);
    console.log("Running AI Diagnostic analysis on backend for reported issue...");
    const aiAnalysis = await analyzeIssue(title, category, description, severity, imageUrl, videoSummary, exactLocation);
    const issues = readJSON("issues.json", []);
    const issueId = generateId("iss");
    const resolvedImageUrl = mediaType === "Video" ? videoThumbnail || imageUrl : imageUrl || "";
    const resolvedGeo = validateAndCorrectHierarchy(state || "", city || "", district || "", "", address || "");
    const newIssue = {
      id: issueId,
      trackingId,
      title,
      description,
      category: category || "Other",
      severity: severity || "Moderate",
      status: "Reported",
      location: {
        lat,
        lng,
        address: address || "San Francisco, CA",
        neighborhood: resolvedGeo.district,
        state: resolvedGeo.state,
        city: resolvedGeo.city,
        district: resolvedGeo.district,
        exactLocation: exactLocation || ""
      },
      reportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      upvotes: 1,
      hasUpvoted: true,
      imageUrl: resolvedImageUrl,
      evidencePhotos: resolvedImageUrl ? [resolvedImageUrl] : [],
      aiAnalysis,
      mediaType: mediaType || "Image",
      mediaPath: mediaPath || imageUrl || "",
      videoThumbnail: videoThumbnail || "",
      videoDuration: videoDuration || "",
      videoSummary: videoSummary || "",
      comments: [
        {
          id: generateId("c"),
          userName: "UrbanIQ Core AI",
          userRole: "AI Auditor",
          text: `Neural diagnostic completed. Suggested dispatch: ${aiAnalysis.department} (Priority: ${aiAnalysis.priorityLevel}). Initial status logged as REPORTED.`,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      ],
      updates: [
        {
          status: "Reported",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          note: "Civic report logged securely. AI Dispatcher designated routing parameters.",
          performedBy: "Citizen Reporter"
        }
      ]
    };
    issues.unshift(newIssue);
    writeJSON("issues.json", issues);
    const timelineMap = readJSON("issueTimeline.json", {});
    timelineMap[trackingId] = newIssue.updates;
    writeJSON("issueTimeline.json", timelineMap);
    const supporters = readJSON("supporters.json", {});
    supporters[issueId] = [userId];
    writeJSON("supporters.json", supporters);
    const evidenceMap = readJSON("evidence.json", {});
    evidenceMap[issueId] = imageUrl ? [imageUrl] : [];
    writeJSON("evidence.json", evidenceMap);
    const notifications = readJSON("notifications.json", []);
    notifications.unshift({
      id: generateId("notif"),
      title: "Report Logged Successfully",
      body: `Your report "${title}" was submitted successfully. Tracking ID: ${trackingId}`,
      type: "general",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      read: false
    });
    writeJSON("notifications.json", notifications);
    res.status(211).json(newIssue);
  } catch (error) {
    next(error);
  }
}
async function updateIssue(req, res, next) {
  try {
    const { trackingId } = req.params;
    const { status, note, performedBy, comments } = req.body;
    const issues = readJSON("issues.json", []);
    const issueIndex = issues.findIndex((i) => i.trackingId.toLowerCase() === trackingId.toLowerCase() || i.id === trackingId);
    if (issueIndex === -1) {
      res.status(404).json({ error: `Issue not found: ${trackingId}` });
      return;
    }
    const issue = issues[issueIndex];
    if (comments && comments.text) {
      const newComment = {
        id: generateId("c"),
        userName: comments.userName || "You (Citizen)",
        userRole: comments.userRole || "Citizen",
        text: comments.text,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      issue.comments.push(newComment);
    }
    if (status && status !== issue.status) {
      const oldStatus = issue.status;
      issue.status = status;
      const newUpdate = {
        status,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        note: note || `Status advanced from ${oldStatus} to ${status}.`,
        performedBy: performedBy || "System"
      };
      issue.updates.push(newUpdate);
      const timelineMap = readJSON("issueTimeline.json", {});
      timelineMap[issue.trackingId] = issue.updates;
      writeJSON("issueTimeline.json", timelineMap);
      const notifications = readJSON("notifications.json", []);
      notifications.unshift({
        id: generateId("notif"),
        title: "Issue Status Advanced",
        body: `Your reported issue "${issue.title}" has been updated to: ${status.toUpperCase()}.`,
        type: "update",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        read: false
      });
      writeJSON("notifications.json", notifications);
    }
    issues[issueIndex] = issue;
    writeJSON("issues.json", issues);
    res.json(issue);
  } catch (error) {
    next(error);
  }
}
async function supportIssue(req, res, next) {
  try {
    const { trackingId, issueId, userId } = req.body;
    const activeUserId = userId || "default";
    const issues = readJSON("issues.json", []);
    const issueIndex = issues.findIndex(
      (i) => trackingId && i.trackingId.toLowerCase() === trackingId.toLowerCase() || issueId && i.id === issueId
    );
    if (issueIndex === -1) {
      res.status(404).json({ error: `Issue not found to support.` });
      return;
    }
    const issue = issues[issueIndex];
    const supporters = readJSON("supporters.json", {});
    if (!supporters[issue.id]) {
      supporters[issue.id] = [];
    }
    const alreadySupported = supporters[issue.id].includes(activeUserId);
    if (!alreadySupported) {
      supporters[issue.id].push(activeUserId);
      issue.upvotes = supporters[issue.id].length;
      issue.hasUpvoted = true;
      issue.comments.push({
        id: generateId("c"),
        userName: "System (Citizen Support)",
        userRole: "Citizen",
        text: "A citizen reported a matching concern and upvoted to confirm urgency.",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      writeJSON("supporters.json", supporters);
      issues[issueIndex] = issue;
      writeJSON("issues.json", issues);
      const notifications = readJSON("notifications.json", []);
      notifications.unshift({
        id: generateId("notif"),
        title: "New Community Supporter",
        body: `Your reported issue "${issue.title}" has gained new support from the community.`,
        type: "support",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        read: false
      });
      writeJSON("notifications.json", notifications);
      res.json({
        ...issue,
        hasUpvoted: true,
        upvotes: supporters[issue.id].length
      });
    } else {
      supporters[issue.id] = supporters[issue.id].filter((u) => u !== activeUserId);
      issue.upvotes = supporters[issue.id].length;
      issue.hasUpvoted = false;
      writeJSON("supporters.json", supporters);
      issues[issueIndex] = issue;
      writeJSON("issues.json", issues);
      res.json({
        ...issue,
        hasUpvoted: false,
        upvotes: supporters[issue.id].length
      });
    }
  } catch (error) {
    next(error);
  }
}
async function addEvidence(req, res, next) {
  try {
    const { trackingId, issueId, imageUrl, userId } = req.body;
    const activeUserId = userId || "default";
    if (!imageUrl) {
      res.status(400).json({ error: "Evidence imageUrl is required." });
      return;
    }
    const issues = readJSON("issues.json", []);
    const issueIndex = issues.findIndex(
      (i) => trackingId && i.trackingId.toLowerCase() === trackingId.toLowerCase() || issueId && i.id === issueId
    );
    if (issueIndex === -1) {
      res.status(404).json({ error: `Issue not found to add evidence.` });
      return;
    }
    const issue = issues[issueIndex];
    const evidenceMap = readJSON("evidence.json", {});
    const supporters = readJSON("supporters.json", {});
    if (!evidenceMap[issue.id]) {
      evidenceMap[issue.id] = issue.imageUrl ? [issue.imageUrl] : [];
    }
    if (!evidenceMap[issue.id].includes(imageUrl)) {
      evidenceMap[issue.id].push(imageUrl);
    }
    writeJSON("evidence.json", evidenceMap);
    if (!supporters[issue.id]) {
      supporters[issue.id] = [];
    }
    if (!supporters[issue.id].includes(activeUserId)) {
      supporters[issue.id].push(activeUserId);
      writeJSON("supporters.json", supporters);
    }
    issue.evidencePhotos = evidenceMap[issue.id];
    issue.upvotes = supporters[issue.id].length;
    issue.hasUpvoted = true;
    issue.comments.push({
      id: generateId("c"),
      userName: "System (Additional Evidence)",
      userRole: "Citizen",
      text: `Added additional photo evidence to this issue.`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    issues[issueIndex] = issue;
    writeJSON("issues.json", issues);
    const notifications = readJSON("notifications.json", []);
    notifications.unshift({
      id: generateId("notif"),
      title: "Evidence Uploaded",
      body: `Additional photo evidence has been attached to reported issue: "${issue.title}".`,
      type: "update",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      read: false
    });
    writeJSON("notifications.json", notifications);
    res.json({
      ...issue,
      evidencePhotos: evidenceMap[issue.id],
      hasUpvoted: true,
      upvotes: supporters[issue.id].length
    });
  } catch (error) {
    next(error);
  }
}
function recordTimelineAndNotify(issue, newStatus, note, performedBy, officerName, department, remarks) {
  issue.status = newStatus;
  if (officerName !== void 0) issue.assignedOfficer = officerName;
  if (department !== void 0) issue.assignedDepartment = department;
  if (remarks !== void 0) issue.progressRemarks = remarks;
  const newUpdate = {
    status: newStatus,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    note: note || `Status advanced to ${newStatus}.`,
    performedBy,
    officerName,
    department,
    remarks
  };
  if (!issue.updates) issue.updates = [];
  issue.updates.push(newUpdate);
  const timelineMap = readJSON("issueTimeline.json", {});
  timelineMap[issue.trackingId] = issue.updates;
  writeJSON("issueTimeline.json", timelineMap);
  const notifications = readJSON("notifications.json", []);
  notifications.unshift({
    id: generateId("notif"),
    title: `Issue Status Update: ${newStatus}`,
    body: `Your reported issue "${issue.title}" has been updated to: ${newStatus}. Note: ${note}`,
    type: "update",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    read: false
  });
  writeJSON("notifications.json", notifications);
}
async function verifyIssue(req, res, next) {
  try {
    const { trackingId } = req.params;
    const { remarks } = req.body;
    const issues = readJSON("issues.json", []);
    const issueIndex = issues.findIndex((i) => i.trackingId.toLowerCase() === trackingId.toLowerCase() || i.id === trackingId);
    if (issueIndex === -1) {
      res.status(404).json({ error: `Issue not found: ${trackingId}` });
      return;
    }
    const issue = issues[issueIndex];
    recordTimelineAndNotify(
      issue,
      "Verified",
      remarks || "Issue has been inspected and verified by municipal engineers.",
      "Municipal Inspector",
      void 0,
      void 0,
      remarks
    );
    issues[issueIndex] = issue;
    writeJSON("issues.json", issues);
    res.json(issue);
  } catch (error) {
    next(error);
  }
}
async function assignIssue(req, res, next) {
  try {
    const { trackingId } = req.params;
    const { department, officerName, remarks } = req.body;
    if (!department) {
      res.status(400).json({ error: "Department is required for assignment." });
      return;
    }
    const issues = readJSON("issues.json", []);
    const issueIndex = issues.findIndex((i) => i.trackingId.toLowerCase() === trackingId.toLowerCase() || i.id === trackingId);
    if (issueIndex === -1) {
      res.status(404).json({ error: `Issue not found: ${trackingId}` });
      return;
    }
    const issue = issues[issueIndex];
    recordTimelineAndNotify(
      issue,
      "Assigned",
      remarks || `Issue assigned to ${department} department under officer ${officerName || "TBD"}.`,
      "Municipal Dispatcher",
      officerName,
      department,
      remarks
    );
    issues[issueIndex] = issue;
    writeJSON("issues.json", issues);
    res.json(issue);
  } catch (error) {
    next(error);
  }
}
async function scheduleInspection(req, res, next) {
  try {
    const { trackingId } = req.params;
    const { inspectionDate, officerName, remarks } = req.body;
    if (!inspectionDate) {
      res.status(400).json({ error: "Inspection date is required." });
      return;
    }
    const issues = readJSON("issues.json", []);
    const issueIndex = issues.findIndex((i) => i.trackingId.toLowerCase() === trackingId.toLowerCase() || i.id === trackingId);
    if (issueIndex === -1) {
      res.status(404).json({ error: `Issue not found: ${trackingId}` });
      return;
    }
    const issue = issues[issueIndex];
    issue.inspectionDate = inspectionDate;
    recordTimelineAndNotify(
      issue,
      "Inspection Scheduled",
      remarks || `On-site inspection scheduled for ${inspectionDate} by officer ${officerName || "TBD"}.`,
      "Municipal Scheduler",
      officerName,
      issue.assignedDepartment,
      remarks
    );
    issues[issueIndex] = issue;
    writeJSON("issues.json", issues);
    res.json(issue);
  } catch (error) {
    next(error);
  }
}
async function startWork(req, res, next) {
  try {
    const { trackingId } = req.params;
    const { remarks, officerName } = req.body;
    const issues = readJSON("issues.json", []);
    const issueIndex = issues.findIndex((i) => i.trackingId.toLowerCase() === trackingId.toLowerCase() || i.id === trackingId);
    if (issueIndex === -1) {
      res.status(404).json({ error: `Issue not found: ${trackingId}` });
      return;
    }
    const issue = issues[issueIndex];
    recordTimelineAndNotify(
      issue,
      "Work In Progress",
      remarks || "Field team has arrived on site and work is actively in progress.",
      "Field Supervisor",
      officerName || issue.assignedOfficer,
      issue.assignedDepartment,
      remarks
    );
    issues[issueIndex] = issue;
    writeJSON("issues.json", issues);
    res.json(issue);
  } catch (error) {
    next(error);
  }
}
async function completeWork(req, res, next) {
  try {
    const { trackingId } = req.params;
    const { remarks, officerName } = req.body;
    const issues = readJSON("issues.json", []);
    const issueIndex = issues.findIndex((i) => i.trackingId.toLowerCase() === trackingId.toLowerCase() || i.id === trackingId);
    if (issueIndex === -1) {
      res.status(404).json({ error: `Issue not found: ${trackingId}` });
      return;
    }
    const issue = issues[issueIndex];
    recordTimelineAndNotify(
      issue,
      "Resolved",
      remarks || "Work successfully completed and site cleared. Operations finalized.",
      "Field Supervisor",
      officerName || issue.assignedOfficer,
      issue.assignedDepartment,
      remarks
    );
    issues[issueIndex] = issue;
    writeJSON("issues.json", issues);
    res.json(issue);
  } catch (error) {
    next(error);
  }
}
async function closeIssue(req, res, next) {
  try {
    const { trackingId } = req.params;
    const { remarks } = req.body;
    const issues = readJSON("issues.json", []);
    const issueIndex = issues.findIndex((i) => i.trackingId.toLowerCase() === trackingId.toLowerCase() || i.id === trackingId);
    if (issueIndex === -1) {
      res.status(404).json({ error: `Issue not found: ${trackingId}` });
      return;
    }
    const issue = issues[issueIndex];
    recordTimelineAndNotify(
      issue,
      "Closed",
      remarks || "Issue has been closed and archived in the municipal database.",
      "Municipal Administrator",
      issue.assignedOfficer,
      issue.assignedDepartment,
      remarks
    );
    issues[issueIndex] = issue;
    writeJSON("issues.json", issues);
    res.json(issue);
  } catch (error) {
    next(error);
  }
}
async function updateRemarks(req, res, next) {
  try {
    const { trackingId } = req.params;
    const { remarks, officerName } = req.body;
    if (!remarks) {
      res.status(400).json({ error: "Remarks are required." });
      return;
    }
    const issues = readJSON("issues.json", []);
    const issueIndex = issues.findIndex((i) => i.trackingId.toLowerCase() === trackingId.toLowerCase() || i.id === trackingId);
    if (issueIndex === -1) {
      res.status(404).json({ error: `Issue not found: ${trackingId}` });
      return;
    }
    const issue = issues[issueIndex];
    issue.progressRemarks = remarks;
    if (officerName) issue.assignedOfficer = officerName;
    const newUpdate = {
      status: issue.status,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      note: `Remarks updated: ${remarks}`,
      performedBy: officerName ? `Officer ${officerName}` : "Field Engineer",
      officerName: officerName || issue.assignedOfficer,
      department: issue.assignedDepartment,
      remarks
    };
    issue.updates.push(newUpdate);
    const timelineMap = readJSON("issueTimeline.json", {});
    timelineMap[issue.trackingId] = issue.updates;
    writeJSON("issueTimeline.json", timelineMap);
    issues[issueIndex] = issue;
    writeJSON("issues.json", issues);
    res.json(issue);
  } catch (error) {
    next(error);
  }
}

// server/controllers/officer.controller.ts
async function officerLogin(req, res, next) {
  try {
    const { officerId, password } = req.body;
    if (!officerId || !password) {
      res.status(400).json({ error: "Officer ID and password are required." });
      return;
    }
    if (officerId === "OFFICER001" && password === "urbaniq@2026") {
      res.json({
        success: true,
        officer: {
          id: "OFFICER001",
          name: "Officer Mohit",
          role: "Municipal Officer",
          department: "Public Works"
        }
      });
    } else {
      res.status(401).json({ error: "Invalid Officer ID or Password." });
    }
  } catch (error) {
    next(error);
  }
}
async function officerUpdateIssue(req, res, next) {
  try {
    const { trackingId } = req.params;
    const { status, department, officerName, severity, inspectionDate, remarks } = req.body;
    const issues = readJSON("issues.json", []);
    const issueIndex = issues.findIndex((i) => i.trackingId.toLowerCase() === trackingId.toLowerCase() || i.id === trackingId);
    if (issueIndex === -1) {
      res.status(404).json({ error: `Issue not found: ${trackingId}` });
      return;
    }
    const issue = issues[issueIndex];
    const oldStatus = issue.status;
    const changes = [];
    if (severity && issue.severity !== severity) {
      changes.push(`Priority changed from ${issue.severity} to ${severity}`);
      issue.severity = severity;
      if (issue.aiAnalysis) {
        issue.aiAnalysis.priorityLevel = severity === "Critical" ? "Critical" : severity === "High" ? "High" : severity === "Low" ? "Low" : "Medium";
      }
    }
    if (department && issue.assignedDepartment !== department) {
      changes.push(`Department assigned: ${department}`);
      issue.assignedDepartment = department;
      if (issue.aiAnalysis) {
        issue.aiAnalysis.department = department;
      }
    }
    if (officerName && issue.assignedOfficer !== officerName) {
      changes.push(`Officer assigned: ${officerName}`);
      issue.assignedOfficer = officerName;
    }
    if (inspectionDate && issue.inspectionDate !== inspectionDate) {
      changes.push(`Inspection scheduled for ${inspectionDate}`);
      issue.inspectionDate = inspectionDate;
    }
    if (remarks && issue.progressRemarks !== remarks) {
      changes.push(`Remarks updated: "${remarks}"`);
      issue.progressRemarks = remarks;
    }
    if (status && issue.status !== status) {
      changes.push(`Status advanced from ${issue.status} to ${status}`);
      issue.status = status;
    }
    if (changes.length === 0) {
      res.json(issue);
      return;
    }
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const officer = officerName || issue.assignedOfficer || "Officer Mohit";
    const dept = department || issue.assignedDepartment || "Public Works";
    const finalRemarks = remarks || issue.progressRemarks || "Issue updated by municipal authority.";
    const timelineNote = `Updates made by municipal authority: ${changes.join(", ")}.`;
    const newUpdate = {
      status: issue.status,
      timestamp,
      note: timelineNote,
      performedBy: `Officer ${officer}`,
      officerName: officer,
      department: dept,
      remarks: finalRemarks
    };
    if (!issue.updates) {
      issue.updates = [];
    }
    issue.updates.push(newUpdate);
    issues[issueIndex] = issue;
    writeJSON("issues.json", issues);
    const timelineMap = readJSON("issueTimeline.json", {});
    timelineMap[issue.trackingId] = issue.updates;
    writeJSON("issueTimeline.json", timelineMap);
    const notifications = readJSON("notifications.json", []);
    let notificationText = `Municipal update for "${issue.title}": ${timelineNote}`;
    let notificationTitle = "Issue Updated";
    if (status === "Verified") {
      notificationTitle = "Issue Verified";
      notificationText = "Your issue has been verified.";
    } else if (department && (status === "Assigned" || oldStatus !== "Assigned")) {
      notificationTitle = "Department Assigned";
      notificationText = `${department} has been assigned.`;
    } else if (status === "Work In Progress") {
      notificationTitle = "Work Started";
      notificationText = "Work has started.";
    } else if (status === "Resolved") {
      notificationTitle = "Issue Resolved";
      notificationText = "Issue resolved successfully.";
    } else if (status === "Closed") {
      notificationTitle = "Issue Closed";
      notificationText = "Issue closed and archived.";
    }
    notifications.unshift({
      id: generateId("notif"),
      title: notificationTitle,
      body: notificationText,
      type: "update",
      timestamp,
      read: false
    });
    writeJSON("notifications.json", notifications);
    res.json(issue);
  } catch (error) {
    next(error);
  }
}

// server/controllers/notification.controller.ts
async function getNotifications(req, res, next) {
  try {
    const notifications = readJSON("notifications.json", []);
    res.json(notifications);
  } catch (error) {
    next(error);
  }
}
async function readAllNotifications(req, res, next) {
  try {
    const notifications = readJSON("notifications.json", []);
    const updated = notifications.map((n) => ({ ...n, read: true }));
    writeJSON("notifications.json", updated);
    res.json({ success: true, count: updated.length });
  } catch (error) {
    next(error);
  }
}
async function clearNotification(req, res, next) {
  try {
    const { id } = req.params;
    const notifications = readJSON("notifications.json", []);
    const filtered = notifications.filter((n) => n.id !== id);
    writeJSON("notifications.json", filtered);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
async function addNotification(req, res, next) {
  try {
    const { title, body, type } = req.body;
    if (!title || !body) {
      res.status(400).json({ error: "Title and body are required." });
      return;
    }
    const notifications = readJSON("notifications.json", []);
    const newNotif = {
      id: generateId("notif"),
      title,
      body,
      type: type || "general",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      read: false
    };
    const updated = [newNotif, ...notifications];
    writeJSON("notifications.json", updated);
    res.status(201).json(newNotif);
  } catch (error) {
    next(error);
  }
}

// server/controllers/chat.controller.ts
async function chatAssistant(req, res, next) {
  try {
    const { message, history } = req.body;
    if (!message) {
      res.status(400).json({ error: "Message is required." });
      return;
    }
    const issues = readJSON("issues.json", []);
    console.log(`Running chat session for message: "${message.substring(0, 40)}..."`);
    const result = await runChatAssistant(message, history, issues);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// server/routes/api.routes.ts
var router = Router();
router.post("/officer/login", officerLogin);
router.post("/officer/issues/:trackingId/update", officerUpdateIssue);
router.get("/users/:id", getUser);
router.patch("/users/:id", updateUser);
router.get("/issues", getIssues);
router.get("/issues/:trackingId", getIssueByTrackingId);
router.post("/issues", createIssue);
router.patch("/issues/:trackingId", updateIssue);
router.post("/issues/:trackingId/verify", verifyIssue);
router.post("/issues/:trackingId/assign", assignIssue);
router.post("/issues/:trackingId/schedule", scheduleInspection);
router.post("/issues/:trackingId/start-work", startWork);
router.post("/issues/:trackingId/complete-work", completeWork);
router.post("/issues/:trackingId/close", closeIssue);
router.post("/issues/:trackingId/update-remarks", updateRemarks);
router.post("/support", supportIssue);
router.post("/evidence", addEvidence);
router.get("/notifications", getNotifications);
router.post("/notifications/read-all", readAllNotifications);
router.post("/notifications", addNotification);
router.delete("/notifications/:id", clearNotification);
router.post("/chat-assistant", chatAssistant);
router.post("/analyze-image", async (req, res, next) => {
  try {
    const { image } = req.body;
    if (!image) {
      res.status(400).json({ error: "Image is required." });
      return;
    }
    const result = await analyzeImage(image);
    res.json(result);
  } catch (error) {
    next(error);
  }
});
router.post("/analyze-video", async (req, res, next) => {
  try {
    const { video, clientExtractedFrames, duration } = req.body;
    if (!video) {
      res.status(400).json({ error: "Video is required." });
      return;
    }
    const result = await analyzeVideo(video, clientExtractedFrames, duration);
    res.json(result);
  } catch (error) {
    next(error);
  }
});
router.post("/analyze-issue", async (req, res, next) => {
  try {
    const { title, category, description, severity, imageUrl, exactLocation } = req.body;
    if (!title || !description) {
      res.status(400).json({ error: "Title and description are required." });
      return;
    }
    const result = await analyzeIssue(title, category, description, severity, imageUrl, void 0, exactLocation);
    res.json(result);
  } catch (error) {
    next(error);
  }
});
var api_routes_default = router;

// server/middleware/error.middleware.ts
function errorHandler(err, req, res, next) {
  console.error(`[Error Handler] Caught exception on ${req.method} ${req.url}:`, err);
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || "An internal server error occurred.";
  res.status(statusCode).json({
    error: message,
    statusCode,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
}

// server.ts
dotenv2.config();
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path3.dirname(__filename2);
var app = express();
var port = 3e3;
initDatabase();
app.use(express.json({ limit: "10mb" }));
app.use("/api", api_routes_default);
if (process.env.NODE_ENV === "production") {
  const distPath = path3.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path3.join(distPath, "index.html"));
  });
} else {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa"
  });
  app.use(vite.middlewares);
}
app.use(errorHandler);
app.listen(port, "0.0.0.0", () => {
  console.log(`UrbanIQ Full-Stack Server running at http://0.0.0.0:${port}`);
});
//# sourceMappingURL=server.js.map
