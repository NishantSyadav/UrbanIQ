import { CivicIssue, Comment, UpdateState } from '../../src/types';

export const DEFAULT_USER = {
  fullName: 'The Blood Gaming',
  email: 'dummy@gmail.com',
  phone: '+1 (555) 019-2834',
  occupation: 'Engineer',
  city: 'San Francisco',
  photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
};

export const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Issue Status Advanced',
    body: 'Your reported issue "Water Leakage Near Oakwood Heights" has been marked as IN PROGRESS.',
    type: 'update',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    read: false
  },
  {
    id: 'notif-2',
    title: 'New Community Supporter',
    body: '3 citizens have upvoted your report "Deep Potholes on Main St" to confirm urgency.',
    type: 'support',
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
    read: false
  },
  {
    id: 'notif-3',
    title: 'Resolution Alert',
    body: 'Crews have successfully resolved "Broken streetlights at central sector 3". Thank you for making our streets safer!',
    type: 'resolve',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    read: true
  }
];

export const PRE_SEEDED_ISSUES: CivicIssue[] = [
  {
    id: 'iss-1',
    trackingId: 'UIQ-4829-X8',
    title: 'Craters on Main St and 4th Ave Intersection',
    description: 'There are three very deep potholes right in the middle of the intersection. Cars are swerving dangerously into oncoming traffic to avoid them. One tire has already popped tonight.',
    category: 'Potholes',
    severity: 'Severe',
    status: 'Work In Progress',
    location: {
      lat: 37.7749,
      lng: -122.4194,
      address: 'Corner of Main St and 4th Ave',
      neighborhood: 'Downtown Core'
    },
    reportedAt: '2026-06-24T08:30:00-07:00',
    upvotes: 42,
    hasUpvoted: false,
    imageUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600',
    aiAnalysis: {
      technicalSummary: 'Severe road surface disintegration at high-volume signalized intersection. Multiple circular surface cavities measured >3.5 inches in depth, posing high kinetic hazard to passing vehicles and disrupting normal lane geometry.',
      department: 'Public Works',
      priorityLevel: 'High',
      complexityRating: 'Moderate',
      estimatedTimeline: '24-48 hours',
      aiConfidence: 96,
      citizenSafetyGuidelines: [
        'Reduce speed to under 15 MPH when approaching this intersection.',
        'Do not swerve into oncoming lanes; keep wheels straight if impact is unavoidable.',
        'Cyclists should dismount and walk along pedestrian sidewalk paths.'
      ],
      requiredEquipment: [
        'Rapid-set cold-mix asphalt compound',
        'Vibratory plate compactor / roller',
        'Active safety warning signage and safety pylons',
        'Hydraulic debris asphalt saw'
      ],
      aiAutoKeywords: ['CavityHazard', 'MainStreet', 'PotholeImpact', 'VehicleDanger']
    },
    comments: [
      {
        id: 'c-1',
        userName: 'Sarah Jenkins',
        userRole: 'Citizen',
        text: 'Blew out my left front tire here yesterday! Glad someone finally mapped this.',
        timestamp: '2026-06-24T09:15:00-07:00'
      },
      {
        id: 'c-2',
        userName: 'UrbanIQ Dispatch',
        userRole: 'Dispatcher',
        text: 'Automated AI Dispatch routed this to Public Works Crew Delta. Scheduled for immediate patch work.',
        timestamp: '2026-06-24T10:00:00-07:00'
      }
    ],
    updates: [
      {
        status: 'Reported',
        timestamp: '2026-06-24T08:30:00-07:00',
        note: 'Report registered in system. Automated AI Analysis triggered.',
        performedBy: 'Citizen Reporter'
      },
      {
        status: 'Verified',
        timestamp: '2026-06-24T08:31:00-07:00',
        note: 'AI classified issue as Road Hazard with 96% confidence. Recommended High priority dispatch.',
        performedBy: 'UrbanIQ Core AI'
      },
      {
        status: 'Inspection Scheduled',
        timestamp: '2026-06-24T10:00:00-07:00',
        note: 'Assigned to Public Works Depot 3 - Delta Crew. Scheduled for patch repair.',
        performedBy: 'System Dispatcher'
      },
      {
        status: 'Work In Progress',
        timestamp: '2026-06-25T04:15:00-07:00',
        note: 'Crew arrived at site. Temporary lane closures established. Commencing asphalt fill.',
        performedBy: 'Field Supervisor Miller'
      }
    ]
  },
  {
    id: 'iss-2',
    trackingId: 'UIQ-1092-B2',
    title: 'Massive garbage pileup blocking sidewalk',
    description: 'Over 15 large black trash bags and loose commercial cardboard waste have been dumped on the curb. It is blocking the entire sidewalk and attracting rodents. Spilling into the street.',
    category: 'Garbage accumulation',
    severity: 'Moderate',
    status: 'Inspection Scheduled',
    location: {
      lat: 37.7833,
      lng: -122.4167,
      address: '1420 Broadway St',
      neighborhood: 'Nob Hill North'
    },
    reportedAt: '2026-06-24T18:15:00-07:00',
    upvotes: 18,
    imageUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=600',
    aiAnalysis: {
      technicalSummary: 'Medium-density solid waste accumulation encroaching upon ADA-compliant pedestrian sidewalk corridor. Risk of rodent infestation, sanitary biohazards, and minor localized water flow blockage in gutters.',
      department: 'Sanitation & Waste Management',
      priorityLevel: 'Medium',
      complexityRating: 'Simple',
      estimatedTimeline: '24 hours',
      aiConfidence: 94,
      citizenSafetyGuidelines: [
        'Do not handle or open bags containing commercial refuse.',
        'Walk around the obstruction using the opposite side sidewalk.',
        'Report any hazardous smells or toxic waste visual signs.'
      ],
      requiredEquipment: [
        'Sanitation flatbed disposal truck',
        'Industrial mechanical sweep tools',
        'Enviro-sanitizer chemical disinfectant spray',
        'Heavy-duty puncture-proof gloves'
      ],
      aiAutoKeywords: ['IllegalDumping', 'PedestrianBlock', 'SanitaryAlert', 'BroadwayRefuse']
    },
    comments: [
      {
        id: 'c-3',
        userName: 'David Vance',
        userRole: 'Citizen',
        text: 'This has been piling up since Tuesday from the closed grocery store. Terrible smell.',
        timestamp: '2026-06-24T19:00:00-07:00'
      }
    ],
    updates: [
      {
        status: 'Reported',
        timestamp: '2026-06-24T18:15:00-07:00',
        note: 'Report filed with photo attachment.',
        performedBy: 'Citizen Reporter'
      },
      {
        status: 'Verified',
        timestamp: '2026-06-24T18:20:00-07:00',
        note: 'AI classified as Illegal Waste Dumping. Directed to Waste Management Depot 5.',
        performedBy: 'UrbanIQ Core AI'
      },
      {
        status: 'Inspection Scheduled',
        timestamp: '2026-06-25T01:30:00-07:00',
        note: 'Disposal truck #308 scheduled for early morning sweep at 07:30 AM.',
        performedBy: 'Sanitation Supervisor'
      }
    ]
  },
  {
    id: 'iss-3',
    trackingId: 'UIQ-9938-Z1',
    title: 'Burst water pipe flooding pedestrian pathway',
    description: 'There is a major water pipe leak in the grassy divider at Central Park South. Water is spraying 3 feet high and flooding the walking pathways. Creating muddy zones and wasting lots of clean water.',
    category: 'Water leakage',
    severity: 'Critical',
    status: 'Verified',
    location: {
      lat: 37.7694,
      lng: -122.4862,
      address: 'Central Park South Path, near pond entrance',
      neighborhood: 'Central Park / Sunset'
    },
    reportedAt: '2026-06-25T05:40:00-07:00',
    upvotes: 61,
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=600',
    aiAnalysis: {
      technicalSummary: 'High-pressure subsurface water main pipe rupture. Active liquid discharge estimated at 40-50 gallons per minute, leading to high-rate landscape soil erosion and dangerous surface ponding adjacent to electrical light posts.',
      department: 'Water Authority',
      priorityLevel: 'Critical',
      complexityRating: 'Complex',
      estimatedTimeline: '6-12 hours',
      aiConfidence: 98,
      citizenSafetyGuidelines: [
        'Maintain a distance of at least 20 feet to avoid sinkhole risks due to soil erosion.',
        'Keep clear of any flooded zones surrounding electrical streetlights.',
        'Do not drink from or step in stagnant accumulated park runoff.'
      ],
      requiredEquipment: [
        'Pneumatic pipeline trenching excavator',
        '2-inch dynamic water dewatering pumps',
        'Heavy-duty cast iron replacement water pipe collar',
        'Acoustic leak geophones & line valves keys'
      ],
      aiAutoKeywords: ['MainRupture', 'ParkFlooding', 'WaterWaste', 'SoilErosion']
    },
    comments: [
      {
        id: 'c-4',
        userName: 'Marcus Aurel',
        userRole: 'Citizen',
        text: 'The lawn is turning into a lake! I hope they turn off the main valve soon.',
        timestamp: '2026-06-25T06:00:00-07:00'
      },
      {
        id: 'c-5',
        userName: 'Water Engineer Harris',
        userRole: 'Field Engineer',
        text: 'We have dispatched an emergency pressure-valve operator to shut off Central Park Zone 4 lines. On route.',
        timestamp: '2026-06-25T06:22:00-07:00'
      }
    ],
    updates: [
      {
        status: 'Reported',
        timestamp: '2026-06-25T05:40:00-07:00',
        note: 'Emergency civic alert logged. High flow volume reported.',
        performedBy: 'Citizen Reporter'
      },
      {
        status: 'Verified',
        timestamp: '2026-06-25T05:42:00-07:00',
        note: 'AI flagged as CRITICAL. High hazard of localized soil liquefaction and utility damage. Automated dispatcher notifications delivered to emergency water crew.',
        performedBy: 'UrbanIQ Core AI'
      }
    ]
  },
  {
    id: 'iss-4',
    trackingId: 'UIQ-7729-M4',
    title: 'Three streetlights out in a row on Oak Ave',
    description: 'Between Elm and Maple streets, three streetlights are completely dead. The entire block is pitch black at night. Kids walk home from school this way and it feels extremely unsafe.',
    category: 'Broken streetlights',
    severity: 'Moderate',
    status: 'Resolved',
    location: {
      lat: 37.7554,
      lng: -122.4354,
      address: '700 Oak Ave',
      neighborhood: 'Oakwood Heights'
    },
    reportedAt: '2026-06-20T21:10:00-07:00',
    upvotes: 29,
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
    aiAnalysis: {
      technicalSummary: 'Sequential multi-luminaire failure along secondary suburban residential collector street. Indicates localized power distribution feed failure or synchronous photo-cell controller damage rather than single bulb burnout.',
      department: 'Transportation & Lighting',
      priorityLevel: 'Medium',
      complexityRating: 'Simple',
      estimatedTimeline: '2-4 days',
      aiConfidence: 91,
      citizenSafetyGuidelines: [
        'Utilize smartphone flashlight or hand-lamps when traversing this segment after dusk.',
        'Keep to well-lit driveways and avoid shadows.',
        'Report any electrical humming or sparking from the pole bases immediately.'
      ],
      requiredEquipment: [
        'Insulated aerial bucket repair truck',
        'High-output replacement LED bulbs (150W equivalent)',
        'Volt-ohm safety multimeter',
        'Standard underground fuse replacements'
      ],
      aiAutoKeywords: ['Blackout Oak', 'ResidentialGrid', 'LEDBulbFix', 'DarkSafety']
    },
    comments: [
      {
        id: 'c-6',
        userName: 'Elena Rostova',
        userRole: 'Citizen',
        text: 'This street was terrifying last night. Thank you for reporting!',
        timestamp: '2026-06-21T08:12:00-07:00'
      },
      {
        id: 'c-7',
        userName: 'Lighting Tech Diaz',
        userRole: 'Field Engineer',
        text: 'Found a blown sub-station fuse in the pillar near 724 Oak. Replaced fuse and converted all 3 fixtures to energy-efficient smart LED lamps.',
        timestamp: '2026-06-22T14:40:00-07:00'
      }
    ],
    updates: [
      {
        status: 'Reported',
        timestamp: '2026-06-20T21:10:00-07:00',
        note: 'Report filed concerning darkness hazard on Oak Ave.',
        performedBy: 'Citizen Reporter'
      },
      {
        status: 'Verified',
        timestamp: '2026-06-20T21:15:00-07:00',
        note: 'AI classified as Broken Streetlights and determined that multi-lamp sequential failure implies a grid fuse issue rather than simple bulb wear.',
        performedBy: 'UrbanIQ Core AI'
      },
      {
        status: 'Inspection Scheduled',
        timestamp: '2026-06-21T09:00:00-07:00',
        note: 'Work Order #LIGHT-881 routed to Grid Crew Bravo.',
        performedBy: 'Grid Coordinator'
      },
      {
        status: 'Work In Progress',
        timestamp: '2026-06-22T13:10:00-07:00',
        note: 'Crew on site. High-altitude bucket raised to test photo-sensitive receptors.',
        performedBy: 'Lighting Tech Diaz'
      },
      {
        status: 'Resolved',
        timestamp: '2026-06-22T14:45:00-07:00',
        note: 'Fuses replaced. Luminaires upgraded to LED. Verified full lumen output. Issue resolved.',
        performedBy: 'Field Supervisor Harris'
      }
    ]
  },
  {
    id: 'iss-5',
    trackingId: 'UIQ-2201-P9',
    title: 'Severe sewer backup flooding basement lane',
    description: 'During the heavy rain, the storm drains along the alleyway clogged. There is raw sewage backing up from the grates and flooding the loading dock lane. Extremely unhygienic and causing traffic jams.',
    category: 'Drainage blockage',
    severity: 'Critical',
    status: 'Inspection Scheduled',
    location: {
      lat: 37.7812,
      lng: -122.4098,
      address: '74 Market St, Gutter lane',
      neighborhood: 'SoMa Business Hub'
    },
    reportedAt: '2026-06-25T03:10:00-07:00',
    upvotes: 34,
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=600',
    aiAnalysis: {
      technicalSummary: 'Subsurface sewer mainline obstruction combined with high storm-water load. Effluent overflow observed at street level grates, posing serious biological health hazard and local business inundation risk.',
      department: 'Water Authority',
      priorityLevel: 'High',
      complexityRating: 'Complex',
      estimatedTimeline: '12-24 hours',
      aiConfidence: 93,
      citizenSafetyGuidelines: [
        'Do not make contact with raw effluent/wastewater.',
        'Seal basement drains or activate sumps in nearby buildings.',
        'Keep vehicles clear of the flooded lane to avoid contaminating exhaust grids.'
      ],
      requiredEquipment: [
        'Dynamic high-velocity sewer flusher truck',
        'CCTV Sewer Crawler Camera',
        'Biological waste sanitizer spray',
        'Temporary inflatable bypass water plugs'
      ],
      aiAutoKeywords: ['SewerSilt', 'EffluentOverflow', 'MarketAvenue', 'HazardStorm']
    },
    comments: [
      {
        id: 'c-8',
        userName: 'Aiden Vance',
        userRole: 'Citizen',
        text: 'The smell is making its way inside our office building. Hope the storm crew arrives shortly.',
        timestamp: '2026-06-25T04:00:00-07:00'
      }
    ],
    updates: [
      {
        status: 'Reported',
        timestamp: '2026-06-25T03:10:00-07:00',
        note: 'Critical blockage logged near Market St alley.',
        performedBy: 'Citizen Reporter'
      },
      {
        status: 'Verified',
        timestamp: '2026-06-25T03:14:00-07:00',
        note: 'AI classified as Sewage Drainage Obstruction. Recommended emergency sanitation routing.',
        performedBy: 'UrbanIQ Core AI'
      },
      {
        status: 'Inspection Scheduled',
        timestamp: '2026-06-25T05:00:00-07:00',
        note: 'Emergency Hydro-Vac Truck #12 scheduled to arrive by 09:30 AM.',
        performedBy: 'Water Authority Dispatch'
      }
    ]
  }
];
