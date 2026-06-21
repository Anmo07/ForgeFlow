import uuid
from datetime import datetime, date, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.organizations.models import Organization
from app.auth.models import User
from app.memberships.models import Membership
from app.projects.models import Task
from app.invoices.models import Invoice, InvoiceLineItem
from .models import BillingContract, TaskTimeLog, ContractType

class BillingService:

    def calculate_contract_billing(self, db: Session, contract: BillingContract) -> dict:
        """Calculates billing amount for a given contract based on its vector type."""
        subtotal = 0.0
        quantity = 1.0
        description = ""

        if contract.contract_type == ContractType.FIXED_RETAINER:
            subtotal = contract.rate
            quantity = 1.0
            description = f"Fixed Retainer Billing for cycle {contract.billing_cycle_start or ''} to {contract.billing_cycle_end or ''}"

        elif contract.contract_type == ContractType.PER_SEAT:
            # Count active external users in the client organization
            user_count = db.query(func.count(Membership.user_id)).join(
                User, User.id == Membership.user_id
            ).filter(
                Membership.organization_id == contract.client_organization_id,
                Membership.status == "active",
                User.is_active == True,
                (Membership.is_external == True) | (User.is_external == True)
            ).scalar() or 0
            
            quantity = float(user_count)
            subtotal = quantity * contract.rate
            description = f"Seat-based Billing ({user_count} active users) at rate {contract.rate}/seat"

        elif contract.contract_type == ContractType.TIME_AND_MATERIAL:
            # Aggregated hours logged in TaskTimeLog
            query = db.query(func.sum(TaskTimeLog.hours)).join(
                Task, Task.id == TaskTimeLog.task_id
            ).filter(
                Task.client_organization_id == contract.client_organization_id
            )
            
            if contract.billing_cycle_start:
                query = query.filter(TaskTimeLog.logged_at >= datetime.combine(contract.billing_cycle_start, datetime.min.time()))
            if contract.billing_cycle_end:
                query = query.filter(TaskTimeLog.logged_at <= datetime.combine(contract.billing_cycle_end, datetime.max.time()))
                
            total_hours = query.scalar() or 0.0
            quantity = float(total_hours)
            subtotal = quantity * contract.rate
            description = f"Time & Material Billing ({total_hours} logged hours) at rate {contract.rate}/hr"

        return {
            "subtotal": subtotal,
            "quantity": quantity,
            "description": description
        }

    def generate_invoice_for_contract(self, db: Session, contract: BillingContract) -> Optional[Invoice]:
        """Calculates billing and appends a draft Invoice record for an active contract."""
        if not contract.is_active:
            return None

        billing_data = self.calculate_contract_billing(db, contract)
        subtotal = billing_data["subtotal"]
        
        # Format dates
        issue_date = date.today()
        due_date = issue_date + timedelta(days=14)
        invoice_number = f"INV-{issue_date.strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"

        # Create Invoice
        invoice = Invoice(
            organization_id=contract.organization_id,
            client_organization_id=contract.client_organization_id,
            invoice_number=invoice_number,
            issue_date=issue_date,
            due_date=due_date,
            status="draft",
            subtotal=subtotal,
            tax_rate=0.0,
            tax_amount=0.0,
            total=subtotal,
            notes=f"Auto-generated contract invoice for type: {contract.contract_type.value}"
        )
        db.add(invoice)
        db.commit()
        db.refresh(invoice)

        # Create Line Item
        line_item = InvoiceLineItem(
            invoice_id=invoice.id,
            description=billing_data["description"],
            quantity=billing_data["quantity"],
            unit_price=contract.rate,
            amount=subtotal
        )
        db.add(line_item)
        db.commit()
        db.refresh(invoice)
        
        return invoice

    def run_billing_cycle(self, db: Session) -> int:
        """Processes all active billing contracts and generates draft invoices."""
        active_contracts = db.query(BillingContract).filter(BillingContract.is_active == True).all()
        generated_count = 0
        for contract in active_contracts:
            try:
                invoice = self.generate_invoice_for_contract(db, contract)
                if invoice:
                    generated_count += 1
            except Exception as e:
                # Log error and continue with next contract
                import logging
                logging.getLogger("forgeflow.billing").error(
                    f"Failed to generate invoice for contract {contract.id}: {e}", 
                    exc_info=True
                )
        return generated_count
