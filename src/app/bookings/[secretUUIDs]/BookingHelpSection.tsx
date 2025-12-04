"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function BookingHelpSection() {
  return (
    <Card className="bg-muted/30">
      <CardContent className="py-6">
        <div className="text-center">
          <h4 className="font-semibold mb-2">Need Help?</h4>
          <p className="text-sm text-muted-foreground mb-4">
            If you need to modify your dates, cancel your booking, or have any
            questions, please contact our support team.
          </p>
          <Button variant="outline">Contact Support</Button>
        </div>
      </CardContent>
    </Card>
  );
}

