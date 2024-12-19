import math
from django.test import TestCase
from .models import Tournament, Match

class StartTournamentTest(TestCase):
    def setUp(self):
        self.participants = ["Bernard", "Patrick", "Fernand", "Gerard"]
        self.tournament = Tournament.objects.create(
            name="Test Tournament",
            participants=self.participants,
            number_of_players=len(self.participants),
            status="not_started"
        )

    def test_start_tournament(self):
        # Call the start_tournament method
        self.tournament.start_tournament()

        # Check the tournament status
        self.assertEqual(self.tournament.status, "in progress")

        # Calculate the expected number of rounds
        nb_rounds = int(math.log2(len(self.participants)))

        # For a single-elimination tournament with N players, the total number of matches is N-1.
        expected_matches_count = len(self.participants) - 1

        # Check that the correct number of matches have been created
        matches_count = self.tournament.matches.count()
        self.assertEqual(
            matches_count,
            expected_matches_count,
            f"The number of created matches should be {expected_matches_count}, got: {matches_count}"
        )

        # Here, we verify that the first round matches have players assigned
        # Round 1: all matches should have player1 and player2 defined
        first_round_matches = self.tournament.matches.filter(round_number=1)
        for match in first_round_matches:
            self.assertIsNotNone(match.player1, "Player 1 should not be None for the first round matches")
            self.assertIsNotNone(match.player2, "Player 2 should not be None for the first round matches")

        # Now, let's verify that next_matches are correctly assigned
        # For a 4-player tournament:
        # - Round 1: 2 matches
        # - Round 2: 1 match
        # The 2 matches from round 1 should point to the single match of round 2 as their next_match.

        round1_matches = self.tournament.matches.filter(round_number=1).order_by('id')
        round2_matches = self.tournament.matches.filter(round_number=2).order_by('id')
        
        # There should be exactly one match in round 2
        self.assertEqual(round2_matches.count(), 1, "There should be exactly one match in round 2")
        final_match = round2_matches.first()

        # Check each round 1 match has the same next_match (the final match)
        for match in round1_matches:
            self.assertIsNotNone(match.next_match, "Next match should not be None in round 1")
            self.assertEqual(match.next_match, final_match, "All round 1 matches should point to the final match")
        