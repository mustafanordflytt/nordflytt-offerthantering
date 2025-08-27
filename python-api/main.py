#!/usr/bin/env python3
"""
Nordflytt GPT RAG API
Python FastAPI server for Custom GPT integration
"""

from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import os
import logging
from dotenv import load_dotenv
from supabase import create_client, Client
import json
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="Nordflytt GPT RAG API",
    description="API endpoints for Custom GPT integration with Nordflytt CRM",
    version="1.0.0"
)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase configuration
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "https://gindcnpiejkntkangpuc.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
NORDFLYTT_GPT_API_KEY = os.getenv("NORDFLYTT_GPT_API_KEY", "nordflytt_gpt_api_key_2025")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_KEY else None

# Pydantic models
class CustomerLookupRequest(BaseModel):
    email: EmailStr
    phone: Optional[str] = None
    query_context: Optional[str] = None

class BookingDetailsRequest(BaseModel):
    customer_email: Optional[EmailStr] = None
    booking_date: Optional[str] = None
    booking_id: Optional[str] = None

class CreateTicketRequest(BaseModel):
    customer_email: EmailStr
    issue_type: str
    description: str
    priority: Optional[str] = "medium"
    booking_reference: Optional[str] = None

class CalculatePriceRequest(BaseModel):
    volume_m3: float
    floors_from: int
    floors_to: int
    elevator_from: str
    elevator_to: str
    additional_services: List[str] = []
    distance_km: float

# Authentication middleware
async def verify_api_key(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    token = authorization.replace("Bearer ", "")
    if token != NORDFLYTT_GPT_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key for Custom GPT access")
    
    return token

# Helper functions
def generate_ticket_number() -> str:
    """Generate a unique ticket number"""
    import random
    year = datetime.now().year
    random_num = random.randint(1000, 9999)
    return f"NF-{year}-{random_num}"

def calculate_volume_discount(volume: float) -> tuple[float, str]:
    """Calculate volume discount based on m³"""
    if volume >= 30:
        return 0.20, "20% rabatt för 30+ m³"
    elif volume >= 20:
        return 0.15, "15% rabatt för 20-29 m³"
    elif volume >= 15:
        return 0.10, "10% rabatt för 15-19 m³"
    elif volume >= 10:
        return 0.05, "5% rabatt för 10-14 m³"
    return 0.0, ""

def calculate_stairs_fee(floors_from: int, floors_to: int, elevator_from: str, elevator_to: str) -> int:
    """Calculate stairs fee based on floors and elevator availability"""
    fee = 0
    
    # From address
    if elevator_from in ["none", "broken"] and floors_from >= 3:
        fee += 500 if elevator_from == "none" else 300
    
    # To address
    if elevator_to in ["none", "broken"] and floors_to >= 3:
        fee += 500 if elevator_to == "none" else 300
    
    return fee

# Endpoint 1: Customer Lookup
@app.post("/gpt-rag/customer-lookup")
@limiter.limit("100/15minutes")
async def customer_lookup(
    request: Request,
    data: CustomerLookupRequest,
    _: str = Header(None, alias="Authorization", dependencies=[verify_api_key])
):
    try:
        # Log the request
        logger.info(f"Customer lookup request for: {data.email}")
        
        # Try to fetch from Supabase
        if supabase:
            try:
                # Query customer from database
                customer_result = supabase.table('customers').select('*').eq('email', data.email).execute()
                
                if customer_result.data and len(customer_result.data) > 0:
                    customer = customer_result.data[0]
                    
                    # Get booking history
                    bookings_result = supabase.table('jobs').select('*').eq('customer_email', data.email).order('date', desc=True).execute()
                    
                    total_bookings = len(bookings_result.data) if bookings_result.data else 0
                    last_booking = bookings_result.data[0] if bookings_result.data else None
                    
                    # Calculate VIP status
                    total_spent = sum(b.get('total_amount', 0) for b in (bookings_result.data or []))
                    is_vip = total_bookings >= 3 or total_spent > 50000
                    
                    # Generate personalized greeting
                    if is_vip:
                        greeting = f"Hej {customer.get('name', 'kära kund')}! ⭐ Som en av våra värdefulla VIP-kunder, hur kan jag hjälpa dig idag?"
                    elif total_bookings > 0:
                        last_date = last_booking['date'] if last_booking else ''
                        greeting = f"Hej {customer.get('name', '')}! Jag ser din senaste bokning från {last_date}. Hur kan jag hjälpa dig?"
                    else:
                        greeting = f"Hej {customer.get('name', '')}! Välkommen till Nordflytt. Hur kan jag hjälpa dig med din flytt?"
                    
                    # Handle query context
                    if data.query_context and "damage" in data.query_context.lower():
                        greeting += " Jag förstår att du har ett problem - låt mig hjälpa dig direkt."
                    
                    return {
                        "customer_found": True,
                        "customer_data": {
                            "name": customer.get('name', ''),
                            "is_vip": is_vip,
                            "total_bookings": total_bookings,
                            "last_booking": {
                                "date": last_booking['date'] if last_booking else None,
                                "services": last_booking.get('services', []) if last_booking else []
                            } if last_booking else None,
                            "is_returning": total_bookings > 0
                        },
                        "response_context": "vip_customer" if is_vip else "returning_customer" if total_bookings > 0 else "new_customer",
                        "suggested_greeting": greeting
                    }
            except Exception as e:
                logger.error(f"Database error: {str(e)}")
        
        # Fallback to mock data if database fails or no customer found
        mock_customers = {
            "anna.svensson@gmail.com": {
                "name": "Anna Svensson",
                "is_vip": False,
                "total_bookings": 3,
                "last_booking": {"date": "2024-12-15", "services": ["flytt", "packning"]}
            },
            "erik.larsson@hotmail.com": {
                "name": "Erik Larsson",
                "is_vip": True,
                "total_bookings": 5,
                "last_booking": {"date": "2024-11-20", "services": ["flytt", "städning", "magasinering"]}
            }
        }
        
        if data.email in mock_customers:
            customer = mock_customers[data.email]
            greeting = f"Hej {customer['name']}! "
            if customer['is_vip']:
                greeting += "⭐ Som en av våra värdefulla VIP-kunder, hur kan jag hjälpa dig idag?"
            else:
                greeting += f"Jag ser din senaste bokning från {customer['last_booking']['date']}. Hur kan jag hjälpa dig?"
            
            return {
                "customer_found": True,
                "customer_data": {
                    **customer,
                    "is_returning": True
                },
                "response_context": "vip_customer" if customer['is_vip'] else "returning_customer",
                "suggested_greeting": greeting
            }
        
        # New customer
        return {
            "customer_found": False,
            "customer_data": None,
            "response_context": "new_customer",
            "suggested_greeting": "Hej och välkommen till Nordflytt! Jag heter Maja och hjälper dig gärna med din flytt. Vad kan jag göra för dig idag?"
        }
        
    except Exception as e:
        logger.error(f"Error in customer lookup: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint 2: Booking Details
@app.post("/gpt-rag/booking-details")
@limiter.limit("100/15minutes")
async def booking_details(
    request: Request,
    data: BookingDetailsRequest,
    _: str = Header(None, alias="Authorization", dependencies=[verify_api_key])
):
    try:
        logger.info(f"Booking details request: {data.dict()}")
        
        # Try to fetch from Supabase
        if supabase and (data.customer_email or data.booking_id):
            try:
                query = supabase.table('jobs').select('*')
                
                if data.booking_id:
                    query = query.eq('reference_number', data.booking_id)
                elif data.customer_email:
                    query = query.eq('customer_email', data.customer_email)
                    if data.booking_date:
                        query = query.eq('date', data.booking_date)
                
                result = query.order('date', desc=True).limit(1).execute()
                
                if result.data and len(result.data) > 0:
                    booking = result.data[0]
                    
                    # Check if booking can be modified
                    booking_date = datetime.fromisoformat(booking['date'])
                    days_until_move = (booking_date - datetime.now()).days
                    can_modify = days_until_move > 2
                    can_cancel = days_until_move > 7
                    
                    return {
                        "booking_found": True,
                        "booking_data": {
                            "booking_id": booking.get('id'),
                            "reference_number": booking.get('reference_number', f"BK-{booking.get('id', '')[:8]}"),
                            "date": booking.get('date'),
                            "services": booking.get('services', []),
                            "total_amount": booking.get('total_amount', 0),
                            "status": booking.get('status', 'confirmed'),
                            "packed_by_nordflytt": "packning" in booking.get('services', []),
                            "photos_available": booking.get('photos_available', False),
                            "from_address": booking.get('from_address', ''),
                            "to_address": booking.get('to_address', ''),
                            "volume_m3": booking.get('volume_m3', 0)
                        },
                        "service_context": {
                            "has_packing_service": "packning" in booking.get('services', []),
                            "has_cleaning": "städning" in booking.get('services', []),
                            "has_boxes": booking.get('materials', {}).get('boxes', 0) > 0,
                            "has_storage": "magasinering" in booking.get('services', [])
                        },
                        "additional_info": {
                            "can_modify": can_modify,
                            "can_cancel": can_cancel,
                            "invoice_sent": booking.get('invoice_sent', False),
                            "payment_status": booking.get('payment_status', 'pending')
                        }
                    }
            except Exception as e:
                logger.error(f"Database error: {str(e)}")
        
        # Fallback to mock data
        if data.booking_id == "BK-2024-001234" or data.customer_email == "anna.svensson@gmail.com":
            return {
                "booking_found": True,
                "booking_data": {
                    "booking_id": "12345678-1234-1234-1234-123456789012",
                    "reference_number": "BK-2024-001234",
                    "date": "2024-12-15",
                    "services": ["flytt", "packning", "städning"],
                    "total_amount": 8500,
                    "status": "completed",
                    "packed_by_nordflytt": True,
                    "photos_available": True,
                    "from_address": "Vasagatan 10, Stockholm",
                    "to_address": "Östermalm 25, Stockholm",
                    "volume_m3": 25
                },
                "service_context": {
                    "has_packing_service": True,
                    "has_cleaning": True,
                    "has_boxes": False,
                    "has_storage": False
                },
                "additional_info": {
                    "can_modify": False,
                    "can_cancel": False,
                    "invoice_sent": True,
                    "payment_status": "paid"
                }
            }
        
        return {
            "booking_found": False,
            "booking_data": None,
            "service_context": None,
            "additional_info": None
        }
        
    except Exception as e:
        logger.error(f"Error in booking details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint 3: Create Support Ticket
@app.post("/gpt-rag/create-ticket")
@limiter.limit("100/15minutes")
async def create_ticket(
    request: Request,
    data: CreateTicketRequest,
    _: str = Header(None, alias="Authorization", dependencies=[verify_api_key])
):
    try:
        logger.info(f"Create ticket request: {data.dict()}")
        
        # Validate issue type
        valid_issue_types = ["damage_claim", "booking_change", "complaint", "cleaning_issue", "general"]
        if data.issue_type not in valid_issue_types:
            raise HTTPException(status_code=400, detail=f"Invalid issue type. Must be one of: {', '.join(valid_issue_types)}")
        
        # Issue type mappings
        issue_type_names = {
            "damage_claim": "skadeanmälan",
            "booking_change": "bokningsändring",
            "complaint": "klagomål",
            "cleaning_issue": "städningsproblem",
            "general": "allmän fråga"
        }
        
        assigned_teams = {
            "damage_claim": "Claims Department",
            "booking_change": "Booking Team",
            "complaint": "Customer Relations",
            "cleaning_issue": "Quality Control",
            "general": "Customer Service"
        }
        
        estimated_response = {
            "high": "inom 2 timmar",
            "medium": "inom 24 timmar",
            "low": "inom 2 arbetsdagar"
        }
        
        # Generate ticket number
        ticket_number = generate_ticket_number()
        ticket_id = f"ticket-{datetime.now().timestamp()}-{data.customer_email[:5]}"
        
        # Try to save to database
        if supabase:
            try:
                ticket_data = {
                    "ticket_number": ticket_number,
                    "customer_email": data.customer_email,
                    "issue_type": data.issue_type,
                    "description": data.description,
                    "priority": data.priority,
                    "booking_reference": data.booking_reference,
                    "status": "open",
                    "assigned_team": assigned_teams[data.issue_type],
                    "created_by": "ai_customer_service",
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }
                
                result = supabase.table('support_tickets').insert(ticket_data).execute()
                logger.info(f"Ticket created in database: {ticket_number}")
            except Exception as e:
                logger.error(f"Database error creating ticket: {str(e)}")
                # Continue with mock response even if database fails
        
        # Generate suggested response
        base_response = f"Jag har skapat ärende {ticket_number} för din {issue_type_names[data.issue_type]}. "
        
        additional_info = {
            "damage_claim": "Vår skadeavdelning kommer att kontakta dig med information om nästa steg, inklusive eventuell dokumentation som behövs.",
            "booking_change": "Vårt bokningsteam kommer att bekräfta dina ändringar och uppdatera din bokning.",
            "complaint": "Vi tar alla klagomål på allvar. En kundrelationsansvarig kommer att kontakta dig för att lösa situationen.",
            "cleaning_issue": "Vårt kvalitetsteam kommer att granska ärendet och eventuellt schemalägga en ny städning om det behövs.",
            "general": "En kundservicemedarbetare kommer att hantera ditt ärende."
        }
        
        suggested_response = f"{base_response}Du får email {estimated_response[data.priority]} med mer information. {additional_info.get(data.issue_type, '')}"
        
        # Log analytics
        if supabase:
            try:
                analytics_data = {
                    "endpoint": "/create-ticket",
                    "customer_email": data.customer_email,
                    "success": True,
                    "response_time_ms": 100,
                    "request_data": data.dict(),
                    "response_data": {"ticket_number": ticket_number},
                    "timestamp": datetime.now().isoformat()
                }
                supabase.table('gpt_analytics').insert(analytics_data).execute()
            except:
                pass
        
        return {
            "ticket_created": True,
            "ticket_data": {
                "ticket_id": ticket_id,
                "ticket_number": ticket_number,
                "estimated_response": estimated_response[data.priority],
                "assigned_team": assigned_teams[data.issue_type]
            },
            "suggested_response": suggested_response
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating ticket: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint 4: Calculate Price
@app.post("/gpt-rag/calculate-price")
@limiter.limit("100/15minutes")
async def calculate_price(
    request: Request,
    data: CalculatePriceRequest,
    _: str = Header(None, alias="Authorization", dependencies=[verify_api_key])
):
    try:
        logger.info(f"Price calculation request: {data.dict()}")
        
        # Base pricing
        base_hourly_rate = 590  # kr/h excluding VAT
        vat_rate = 0.25
        rut_deduction_rate = 0.5  # 50% for personnel costs
        
        # Calculate time needed (2 movers)
        hours_needed = max(3, data.volume_m3 / 5)  # Minimum 3 hours
        
        # Personnel cost
        personnel_cost = base_hourly_rate * hours_needed * 2  # 2 movers
        personnel_cost_with_vat = personnel_cost * (1 + vat_rate)
        
        # RUT deduction on personnel cost
        rut_savings = personnel_cost_with_vat * rut_deduction_rate
        personnel_cost_after_rut = personnel_cost_with_vat - rut_savings
        
        # Truck cost (not eligible for RUT)
        truck_hourly_rate = 295
        truck_cost = truck_hourly_rate * hours_needed * (1 + vat_rate)
        
        # Calculate stairs fee
        stairs_fee = calculate_stairs_fee(
            data.floors_from, 
            data.floors_to, 
            data.elevator_from, 
            data.elevator_to
        )
        
        # Additional services
        service_costs = []
        additional_cost = 0
        
        service_prices = {
            "packing": 250 * 3,  # 3 hours minimum
            "packning": 250 * 3,
            "cleaning": 1200,
            "städning": 1200,
            "piano": 2500,
            "storage": 500,
            "magasinering": 500
        }
        
        for service in data.additional_services:
            if service.lower() in service_prices:
                cost = service_prices[service.lower()]
                additional_cost += cost
                
                service_names = {
                    "packing": "Packning (3h)",
                    "packning": "Packning (3h)",
                    "cleaning": "Flyttstädning",
                    "städning": "Flyttstädning",
                    "piano": "Pianoflytt",
                    "storage": "Magasinering",
                    "magasinering": "Magasinering"
                }
                
                service_costs.append(f"{service_names.get(service.lower(), service)}: {cost} kr")
        
        # Subtotal before discounts
        subtotal = personnel_cost_after_rut + truck_cost + stairs_fee + additional_cost
        
        # Apply volume discount
        discount_rate, discount_description = calculate_volume_discount(data.volume_m3)
        discount_amount = subtotal * discount_rate
        
        # Final price
        total_price = subtotal - discount_amount
        
        # Savings explanation
        total_savings = rut_savings + discount_amount
        savings_parts = []
        if discount_description:
            savings_parts.append(f"{int(discount_amount)} kr tack vare {discount_description}")
        savings_parts.append(f"{int(rut_savings)} kr med RUT-avdrag")
        savings_explanation = f"Du sparar {' och '.join(savings_parts)}"
        
        # Suggested response
        suggested_response = f"Din flytt kostar {int(total_price)} kr inklusive allt"
        if discount_description:
            suggested_response += f" med {discount_description}"
        suggested_response += f". Detta inkluderar {', '.join([s.lower() for s in data.additional_services])}." if data.additional_services else "."
        suggested_response += f" {savings_explanation}. Priset är redan reducerat med RUT-avdrag där det är tillämpligt."
        
        return {
            "price_calculated": True,
            "pricing_data": {
                "total_price": int(total_price),
                "volume_discount": discount_description,
                "savings_explanation": savings_explanation
            },
            "price_breakdown": {
                "personnel_cost": int(personnel_cost_after_rut),
                "truck_cost": int(truck_cost),
                "stairs_fee": stairs_fee,
                "additional_services": service_costs,
                "subtotal": int(subtotal),
                "discount_amount": int(discount_amount),
                "rut_savings": int(rut_savings)
            },
            "suggested_response": suggested_response
        }
        
    except Exception as e:
        logger.error(f"Error calculating price: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Nordflytt GPT RAG API",
        "timestamp": datetime.now().isoformat(),
        "database_connected": supabase is not None
    }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Nordflytt GPT RAG API",
        "version": "1.0.0",
        "endpoints": [
            "/gpt-rag/customer-lookup",
            "/gpt-rag/booking-details",
            "/gpt-rag/create-ticket",
            "/gpt-rag/calculate-price"
        ],
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)