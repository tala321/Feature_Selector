import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score

class GeneticFeatureSelector:
    def __init__(self, X, y, population_size=10, generations=20, mutation_rate=0.1):
        self.X = X
        self.y = y
        self.population_size = population_size
        self.generations = generations
        self.mutation_rate = mutation_rate
        self.n_features = X.shape[1]
        self.best_chromosome = None
        self.best_accuracy = 0.0
        self.selected_count = 0
        self.selection_ratio = 0.0

    def initialize_population(self):
        return np.random.randint(2, size=(self.population_size, self.n_features))

    def fitness(self, chromosome):
        selected = [i for i, gene in enumerate(chromosome) if gene == 1]
        if not selected:
            return 0
        X_selected = self.X[:, selected]
        X_train, X_test, y_train, y_test = train_test_split(X_selected, self.y, test_size=0.3, random_state=42)
        model = DecisionTreeClassifier()
        model.fit(X_train, y_train)
        return accuracy_score(y_test, model.predict(X_test))

    def crossover(self, p1, p2):
        point = np.random.randint(1, self.n_features - 1)
        return np.concatenate([p1[:point], p2[point:]]), np.concatenate([p2[:point], p1[point:]])

    def mutate(self, chrom):
        for i in range(self.n_features):
            if np.random.rand() < self.mutation_rate:
                chrom[i] = 1 - chrom[i]
        return chrom

    def evolve(self):
        population = self.initialize_population()
        for _ in range(self.generations):
            scores = [self.fitness(ch) for ch in population]
            sorted_idx = np.argsort(scores)[::-1]
            population = population[sorted_idx]
            new_pop = population[:2].tolist()

            while len(new_pop) < self.population_size:
                parents = population[np.random.choice(5, 2, replace=False)]
                c1, c2 = self.crossover(parents[0], parents[1])
                new_pop.append(self.mutate(c1))
                if len(new_pop) < self.population_size:
                    new_pop.append(self.mutate(c2))

            population = np.array(new_pop)

        best = population[0]
        self.best_chromosome = best
        self.best_accuracy = self.fitness(best)
        self.selected_count = int(np.sum(best))
        self.selection_ratio = round(self.selected_count / self.n_features, 2)

        return best, self.best_accuracy