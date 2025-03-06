all : up

up :
	@docker-compose -f docker-compose.yml up -d

down :
	@docker-compose -f docker-compose.yml down

stop :
	@docker-compose -f docker-compose.yml stop

start :
	@docker-compose -f docker-compose.yml start

status :
	@docker ps

clean :
	@docker-compose -f docker-compose.yml down
	@docker system prune -a -f
	@docker buildx prune -af
	@docker volume rm transcendence_postgres_data

re : clean up

