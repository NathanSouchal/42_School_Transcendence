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
        

class FindNextMatchToPlayTest(TestCase):
    def setUp(self):
        # Create a tournament with 4 participants
        self.participants = ["Bernard", "Patrick", "Fernand", "Gerard"]
        self.tournament = Tournament.objects.create(
            name="Test Tournament",
            participants=self.participants,
            number_of_players=len(self.participants),
            status="not_started"
        )
        # Start the tournament (generate matches and the rounds_tree)
        self.tournament.start_tournament()
        # After starting, rounds_tree should look like:
        # [
        #   [m1_id, m2_id],  # Round 1
        #   [m3_id]          # Round 2 (the final)
        # ]

    def test_find_next_match_to_play(self):
        # Retrieve the match IDs from round 1 and round 2
        round1_matches = self.tournament.rounds_tree[0]
        round2_matches = self.tournament.rounds_tree[1]

        m1_id, m2_id = round1_matches[0], round1_matches[1]
        m3_id = round2_matches[0]

        # Case 1: The last played match is m1 (round 1, not the last match of this round)
        # The next match to play in the same round should be m2
        next_match = self.tournament.find_next_match_to_play(m1_id)
        self.assertIsNotNone(next_match, "The next match should not be None after m1")
        self.assertEqual(next_match.id, m2_id, "After m1, the next match should be m2")

        # Case 2: The last played match is m2 (the last match of round 1)
        # There's no more match in round 1 after m2, so the next match should be the first match of round 2, m3
        next_match = self.tournament.find_next_match_to_play(m2_id)
        self.assertIsNotNone(next_match, "The next match should not be None after m2")
        self.assertEqual(next_match.id, m3_id, "After m2, the next match should be m3 (the first match of round 2)")

        # Case 3: The last played match is m3 (the final match)
        # There are no matches after the final, so it should return None
        next_match = self.tournament.find_next_match_to_play(m3_id)
        self.assertIsNone(next_match, "After the final, there should be no next match to play")
