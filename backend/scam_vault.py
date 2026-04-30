import json
import os
import re
from typing import List, Tuple

VAULT_PATH = "scam_vault.json"

class ScamVault:
    def __init__(self):
        self.rules = []
        self._load()

    def _load(self):
        if not os.path.exists(VAULT_PATH):
            # Default crowdsourced rules
            self.rules = [
                {"pattern": r"l0gin-microsoft\.xyz", "weight": 40, "reason": "Reported Phishing Domain"},
                {"pattern": r"whatsapp-gift-card", "weight": 35, "reason": "Reported WhatsApp Scam"},
            ]
            self._save()
        else:
            try:
                with open(VAULT_PATH, "r") as f:
                    self.rules = json.load(f)
            except:
                self.rules = []

    def _save(self):
        with open(VAULT_PATH, "w") as f:
            json.dump(self.rules, f, indent=2)

    def add_rule(self, pattern: str, reason: str, weight: int = 30):
        # Clean the pattern to be a safe regex
        clean_pat = re.escape(pattern).replace(r"\ ", " ")
        self.rules.append({"pattern": clean_pat, "weight": weight, "reason": f"Community Reported: {reason}"})
        self._save()

    def get_signals(self) -> List[Tuple[str, int, str]]:
        return [(r["pattern"], r["weight"], r["reason"]) for r in self.rules]

# Singleton
VAULT = ScamVault()
