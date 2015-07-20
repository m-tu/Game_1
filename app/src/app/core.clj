(ns app.core
  (:use org.httpkit.server
        [clojure.tools.logging :only [info]]
        org.nfrac.cljbox2d.core)
  (:require [ring.middleware.reload :as reload]
            [clojure.data.json :as json]
            [compojure.handler :refer [site]]
            [compojure.route :as route]
            [compojure.core :refer [defroutes GET]]))

(defn set-interval [ms callback]
  (future (while (do (Thread/sleep ms)
                     (try (do (callback) (-> true))
                          (catch Exception e (info (str (.toString e) ": " (.getMessage e)))
                                             (-> false)))))))

(def poopertron (atom nil))

(defn dynamic-entities [state]
  (let [bodies (bodyseq (:world state))]
    (filter #(= (body-type %) :dynamic) bodies)))

(defn add-job [state job]
  (let [new-jobs (conj (:jobs state) job)]
    (assoc state :jobs new-jobs)))

(defn stop-jobs! [state]
  (let [jobs (:jobs state)]
    (doseq [j jobs] (future-cancel j))))

(defn remove-jobs [state]
  (assoc state :jobs []))

(defn body-wire-data [body]
  (-> {:position (position body) :id (:id (user-data body))}))

(defn make-msg [msg-type content]
  (json/write-str {:type msg-type :content content}))

(defn make-spawns [state]
  (map body-wire-data (dynamic-entities state)))

(defn ws-handler [request]
  (with-channel request channel
    (info channel "connected")
    (send! channel (make-msg :spawns (make-spawns @poopertron)))
    (def clients (assoc (:clients @poopertron) channel {:conn-state :unresolved}))
    (swap! poopertron assoc :clients clients)
    (on-close channel (fn [status]
                        (swap! poopertron assoc :clients (dissoc clients channel))
                        (info "channel closed: " status)))
    (on-receive channel (fn [data]
                          (let [msg (json/read-str data :key-fn keyword)]
                            (info msg)
                            (case (:type msg)
                              ; TODO: Create player body, send information
                              "join-req" (let [new-clients (assoc-in clients [channel :conn-state] :connected)]
                                           (swap! poopertron assoc :clients new-clients))
                              "default")
                            (info poopertron))))))

(defroutes all-routes
  (GET "/" [] "gtfo")
  (GET "/feed" [] ws-handler)
  (route/not-found "not found"))

(defn in-dev? [args] true)

(defn connected-players [state]
  (filter (fn [[channel, info]] (= (:conn-state info) :connected))
          (seq (:clients state))))

(defn stop-server []
  (let [state @poopertron]
    (when-not (nil? state)
      (stop-jobs! state)
      (doseq [conn (keys (:clients state))]
        (close conn))
      ((:server state) :timeout 250)
      (reset! poopertron nil))))


(defn move-entities [state]
  (let [bodies (dynamic-entities state)
        n (count bodies)]
    (doseq [b (repeatedly (rand-int n) #(rand-nth bodies))]
      (apply-impulse! b [(+ -6 (rand-int 13)) (+ -6 (rand-int 13))] (center b)))))


(defn state-broadcast [state]
  (let [channels (connected-players state)
        dyn-bodies (dynamic-entities state)]
    (def entities (map body-wire-data dyn-bodies))
    (def msg (make-msg :update entities))
    (doseq [[channel, _] channels]
      (send! channel msg))))

(defn start-server [& args]
  (let [handler (if (in-dev? args)
                 (reload/wrap-reload (site #'all-routes))
                 (site all-routes))]
    (stop-server)
    (let [server (run-server handler { :port 9001})
          world (new-world [0 0])
          clients {}]
      (body! world {:type :static} {:shape (edge [-25 25] [-25 -25])})
      (body! world {:type :static} {:shape (edge [-25 -25] [25 -25])})
      (body! world {:type :static} {:shape (edge [25 -25] [25 25])})
      (body! world {:type :static} {:shape (edge [25 25] [-25 25])})
      (dotimes [n 40]
        (body! world {:position [(+ 5 (rand-int 10)) 10] :user-data {:id n}}
               {:shape (circle 2) :restitution 0.4}))
      (reset! poopertron {:server server
                          :clients clients
                          :world world
                          :jobs [(set-interval 1000 #(move-entities @poopertron))
                                 (set-interval 100 #(state-broadcast @poopertron))
                                 (set-interval 20 #(step! (:world @poopertron) (/ 1 20)))]}))))
